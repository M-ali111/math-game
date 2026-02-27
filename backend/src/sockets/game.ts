import { Server, Socket } from 'socket.io';
import { gameService } from '../services/game';
import { questionService } from '../services/question';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { QuestionLanguage } from '../services/aiQuestion';

const prisma = new PrismaClient();
const gameAnswers = new Map<string, Map<string, boolean>>();
const onlineUsers = new Map<string, { userId: string; username: string; status: 'available' | 'in-game'; gameId?: string }>();

const buildOnlineUsersList = (excludeUserId?: string) => {
  const uniqueUsers = new Map<string, { userId: string; username: string; status: 'available' | 'in-game' }>();
  for (const info of onlineUsers.values()) {
    if (excludeUserId && info.userId === excludeUserId) {
      continue;
    }
    // Only include available users in the list
    if (info.status === 'available' && !uniqueUsers.has(info.userId)) {
      uniqueUsers.set(info.userId, { userId: info.userId, username: info.username, status: info.status });
    }
  }
  return Array.from(uniqueUsers.values());
};

const broadcastOnlineUsers = (io: Server) => {
  io.sockets.sockets.forEach((client) => {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    client.emit('online_users', buildOnlineUsersList(userId));
  });
};

const findSocketIdByUserId = (userId: string) => {
  for (const [socketId, info] of onlineUsers.entries()) {
    if (info.userId === userId) {
      return socketId;
    }
  }
  return null;
};

const handleOpponentLeft = async (gameId: string, leavingUserId: string, io: Server) => {
  try {
    console.log(`[handleOpponentLeft] Starting for gameId: ${gameId}, leavingUserId: ${leavingUserId}`);
    
    const game = await gameService.getGameDetails(gameId);
    console.log(`[handleOpponentLeft] Game found, status: ${game.status}`);
    
    // Check if game is still in progress
    if (game.status !== 'in-progress') {
      console.log(`[handleOpponentLeft] Game not in progress, skipping. Status: ${game.status}`);
      return;
    }

    // Find the other player
    const winnerPlayer = game.players.find((p) => p.userId !== leavingUserId);
    const loserPlayer = game.players.find((p) => p.userId === leavingUserId);

    if (!winnerPlayer || !loserPlayer) {
      console.log(`[handleOpponentLeft] Could not find both players. Winner: ${winnerPlayer?.userId}, Loser: ${loserPlayer?.userId}`);
      return;
    }

    console.log(`[handleOpponentLeft] Winner: ${winnerPlayer.userId}, Loser: ${loserPlayer.userId}`);

    // Mark the winner
    await prisma.gamePlayer.update({
      where: { id: winnerPlayer.id },
      data: { isWinner: true, score: 100, completedAt: new Date() },
    });

    // Mark the loser
    await prisma.gamePlayer.update({
      where: { id: loserPlayer.id },
      data: { isWinner: false, score: 0, completedAt: new Date() },
    });

    // Update game status
    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'completed' },
    });

    // Notify the remaining player - use room name that matches join_game
    const roomName = `game:${gameId}`;
    console.log(`[handleOpponentLeft] Emitting opponent_left to room: ${roomName}`);
    io.to(roomName).emit('opponent_left', {
      message: 'Your opponent left the game',
      result: 'win',
    });

    // Clean up answer tracking
    gameAnswers.delete(gameId);
    console.log(`[handleOpponentLeft] Cleanup complete for gameId: ${gameId}`);
  } catch (error) {
    console.error('[handleOpponentLeft] Error handling opponent left:', error);
  }
};

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Authenticate socket
    socket.on('authenticate', async (data: string | { token: string }) => {
      try {
        const token = typeof data === 'string' ? data : data.token;
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true },
        });

        if (!user) {
          socket.emit('auth_error', 'User not found');
          return;
        }

        socket.data.userId = user.id;
        onlineUsers.set(socket.id, { userId: user.id, username: user.username, status: 'available' });
        socket.emit('authenticated', { userId: user.id, username: user.username });
        broadcastOnlineUsers(io);
      } catch (error) {
        console.error('Auth error:', error);
        socket.emit('auth_error', 'Invalid token');
      }
    });

    socket.on('send_game_request', (data: { toUserId: string; grade: number; language?: QuestionLanguage }) => {
      try {
        const fromUserId = socket.data.userId as string | undefined;
        if (!fromUserId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const targetSocketId = findSocketIdByUserId(data.toUserId);
        if (!targetSocketId) {
          socket.emit('game_request_failed', { message: 'User is offline' });
          return;
        }

        const fromUser = onlineUsers.get(socket.id);
        io.to(targetSocketId).emit('game_request_received', {
          fromUserId,
          fromUsername: fromUser?.username || 'Player',
          grade: data.grade,
          language: data.language ?? 'english',
        });
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('accept_game_request', async (data: { fromUserId: string; grade: number; language?: QuestionLanguage }) => {
      try {
        const acceptUserId = socket.data.userId as string | undefined;
        if (!acceptUserId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const senderSocketId = findSocketIdByUserId(data.fromUserId);
        if (!senderSocketId) {
          socket.emit('game_request_failed', { message: 'User is offline' });
          return;
        }

        const language = data.language ?? 'english';
        const gameData = await gameService.createMultiplayerGame(data.fromUserId, data.grade, language);
        await gameService.joinMultiplayerGame(gameData.gameId, acceptUserId, data.grade, language);

        const senderInfo = onlineUsers.get(senderSocketId);
        const acceptInfo = onlineUsers.get(socket.id);

        // Update both players' status to in-game
        if (senderInfo) senderInfo.status = 'in-game';
        if (acceptInfo) acceptInfo.status = 'in-game';
        broadcastOnlineUsers(io);

        io.to([senderSocketId, socket.id]).emit('game_request_accepted', {
          gameId: gameData.gameId,
          grade: data.grade,
          language,
          players: [
            { userId: data.fromUserId, username: senderInfo?.username || 'Player' },
            { userId: acceptUserId, username: acceptInfo?.username || 'Player' },
          ],
        });
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('decline_game_request', (data: { fromUserId: string }) => {
      try {
        const senderSocketId = findSocketIdByUserId(data.fromUserId);
        if (!senderSocketId) {
          return;
        }

        io.to(senderSocketId).emit('game_request_declined', {
          fromUserId: data.fromUserId,
        });
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    // Join multiplayer game
    socket.on('join_game', async (gameId: string) => {
      try {
        const userId = socket.data.userId;
        
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        console.log(`[join_game] User ${userId} joining game ${gameId}`);

        // Track the game this socket is in (both in socket data and online users map)
        socket.data.gameId = gameId;
        const userInfo = onlineUsers.get(socket.id);
        if (userInfo) {
          userInfo.gameId = gameId;
          userInfo.status = 'in-game';
          console.log(`[join_game] Socket data set:`, socket.data);
          console.log(`[join_game] Online users updated with gameId: ${gameId}`);
          broadcastOnlineUsers(io);
        }

        // Join socket room
        socket.join(`game:${gameId}`);
        console.log(`[join_game] Socket joined room: game:${gameId}`);

        // Get game details
        const game = await gameService.getGameDetails(gameId);
        const playerCount = game.players.length;

        // Notify others that someone joined
        io.to(`game:${gameId}`).emit('player_joined', {
          gameId,
          playerCount,
          players: game.players.map((p) => ({
            id: p.userId,
            username: p.user.username,
          })),
        });

        // If 2 players now, start game
        if (playerCount === 2) {
          const questions = game.questions.map((gq) => ({
            id: gq.question.id,
            text: gq.question.text,
            options: JSON.parse(gq.question.options),
            difficulty: gq.question.difficulty,
            explanation: (gq.question as { explanation?: string | null }).explanation ?? null,
          }));

          io.to(`game:${gameId}`).emit('game_started', {
            gameId,
            questions,
          });

          // Initialize answer tracking
          gameAnswers.set(gameId, new Map());
        }
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    // Submit answer in multiplayer
    socket.on('submit_answer', async (data: { gameId: string; questionId: string; selectedAnswer: number; timeToAnswer: number }) => {
      try {
        const userId = socket.data.userId;
        
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }
        
        const { gameId, questionId, selectedAnswer, timeToAnswer } = data;

        // Verify answer
        const isCorrect = await questionService.verifyAnswer(questionId, selectedAnswer);

        // Save answer
        await prisma.gameAnswer.create({
          data: {
            gameId,
            userId,
            questionId,
            selectedAnswer,
            isCorrect,
            timeToAnswer,
          },
        });

        // Get answers map for this game
        let answers = gameAnswers.get(gameId);
        if (!answers) {
          answers = new Map();
          gameAnswers.set(gameId, answers);
        }

        // Store answer
        answers.set(userId, isCorrect);

        // Broadcast answer (don't reveal correct answer)
        io.to(`game:${gameId}`).emit('answer_submitted', {
          userId,
          isCorrect,
          timeToAnswer,
        });

        // Check if both players answered
        const game = await gameService.getGameDetails(gameId);
        if (answers.size === game.players.length) {
          // Find winner of this round (first to answer correctly, or fastest)
          const roundAnswers = await prisma.gameAnswer.findMany({
            where: { gameId, questionId },
            orderBy: { createdAt: 'asc' },
          });

          let winner = null;
          for (const answer of roundAnswers) {
            if (answer.isCorrect) {
              winner = answer.userId;
              break;
            }
          }

          // Get current question index and send next
          const currentQuestionIndex = game.questions.findIndex(q => q.questionId === questionId);
          const nextQuestionIndex = currentQuestionIndex + 1;

          io.to(`game:${gameId}`).emit('round_result', {
            winner,
            nextQuestionIndex,
          });

          // Clear answers for next round
          answers.clear();

          // If that was the last question, end the game automatically
          if (nextQuestionIndex >= game.questions.length) {
            // Calculate scores for both players
            const allAnswers = await prisma.gameAnswer.findMany({
              where: { gameId },
            });

            // Group by user
            const userScores = new Map<string, { correct: number; total: number }>();
            for (const answer of allAnswers) {
              const uid = answer.userId;
              if (!userScores.has(uid)) {
                userScores.set(uid, { correct: 0, total: 0 });
              }
              const userScore = userScores.get(uid)!;
              userScore.total++;
              if (answer.isCorrect) userScore.correct++;
            }

            // Update all players
            for (const [userId, scoreData] of userScores) {
              const score = Math.round((scoreData.correct / scoreData.total) * 100);
              await prisma.gamePlayer.update({
                where: { gameId_userId: { gameId: gameId, userId: userId } },
                data: {
                  score,
                  completedAt: new Date(),
                },
              });
            }

            // Determine winner
            const gamePlayers = await prisma.gamePlayer.findMany({
              where: { gameId },
              include: { user: true },
            });

            const sortedPlayers = gamePlayers.sort((a, b) => b.score - a.score);
            const winnerPlayer = sortedPlayers[0];
            const loserPlayer = sortedPlayers[1];

            // Mark winner
            await prisma.gamePlayer.update({
              where: { id: winnerPlayer.id },
              data: { isWinner: true },
            });

            // Update game status
            await prisma.game.update({
              where: { id: gameId },
              data: { status: 'completed' },
            });

            // Get who answered each question correctly first
            const questionWinners: { questionId: string; winnerId: string | null }[] = [];
            for (const gq of game.questions) {
              const qAnswers = await prisma.gameAnswer.findMany({
                where: { gameId, questionId: gq.questionId },
                orderBy: { createdAt: 'asc' },
              });
              
              let qWinner: string | null = null;
              for (const ans of qAnswers) {
                if (ans.isCorrect) {
                  qWinner = ans.userId;
                  break;
                }
              }
              questionWinners.push({ questionId: gq.questionId, winnerId: qWinner });
            }

            // Emit game ended
            io.to(`game:${gameId}`).emit('game_ended', {
              winner: winnerPlayer.userId,
              winnerName: winnerPlayer.user.username,
              loser: loserPlayer.userId,
              loserName: loserPlayer.user.username,
              winnerScore: winnerPlayer.score,
              loserScore: loserPlayer.score,
              questionWinners,
            });

            // Update both players' status back to available
            for (const [socketId, userInfo] of onlineUsers.entries()) {
              if (userInfo.userId === winnerPlayer.userId || userInfo.userId === loserPlayer.userId) {
                userInfo.status = 'available';
              }
            }
            broadcastOnlineUsers(io);

            // Clean up
            gameAnswers.delete(gameId);
          }
        }
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    // End game
    socket.on('end_game', async (gameId: string) => {
      try {
        const userId = socket.data.userId;
        
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        // Get all answers
        const answers = await prisma.gameAnswer.findMany({
          where: { gameId, userId },
        });

        const correctAnswers = answers.filter((a) => a.isCorrect).length;
        const totalAnswers = answers.length;
        const score = (correctAnswers / totalAnswers) * 100;

        // Update game player
        await prisma.gamePlayer.update({
          where: {
            gameId_userId: { gameId, userId },
          },
          data: {
            score: Math.round(score),
            completedAt: new Date(),
          },
        });

        // Check if both players completed
        const gamePlayer = await prisma.gamePlayer.findMany({
          where: { gameId },
        });

        const allCompleted = gamePlayer.every((p) => p.completedAt !== null);

        if (allCompleted) {
          const scores = gamePlayer.sort((a, b) => b.score - a.score);
          const winner = scores[0];
          const loser = scores[1];

          // Mark winner
          await prisma.gamePlayer.update({
            where: { id: winner.id },
            data: { isWinner: true },
          });

          // Update game status
          await prisma.game.update({
            where: { id: gameId },
            data: { status: 'completed' },
          });

          // Get player details
          const winnerUser = await prisma.user.findUnique({ where: { id: winner.userId } });
          const loserUser = await prisma.user.findUnique({ where: { id: loser.userId } });

          // Get who answered each question first
          const questionResults = await prisma.gameQuestion.findMany({
            where: { gameId },
            include: {
              question: true,
            },
          });

          const questionWinners = await Promise.all(
            questionResults.map(async (gq) => {
              const firstCorrect = await prisma.gameAnswer.findFirst({
                where: {
                  gameId,
                  questionId: gq.questionId,
                  isCorrect: true,
                },
                orderBy: { createdAt: 'asc' },
              });

              return {
                questionId: gq.questionId,
                questionIndex: gq.questionIndex,
                correctAnswerBy: firstCorrect?.userId || null,
              };
            })
          );

          // Broadcast game end
          io.to(`game:${gameId}`).emit('game_ended', {
            winner: winner.userId,
            winnerName: winnerUser?.username,
            loser: loser.userId,
            loserName: loserUser?.username,
            winnerScore: winner.score,
            loserScore: loser.score,
            questionWinners: questionWinners,
          });

          // Update both players' status back to available
          for (const [socketId, userInfo] of onlineUsers.entries()) {
            if (userInfo.userId === winner.userId || userInfo.userId === loser.userId) {
              userInfo.status = 'available';
            }
          }
          broadcastOnlineUsers(io);
        }
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('update_user_status', (status: 'available' | 'in-game') => {
      try {
        const userInfo = onlineUsers.get(socket.id);
        if (userInfo) {
          userInfo.status = status;
          broadcastOnlineUsers(io);
        }
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('leave_game', async (data: { gameId: string }) => {
      try {
        const userId = socket.data.userId as string | undefined;
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const { gameId } = data;
        console.log(`[leave_game] User ${userId} leaving game ${gameId}`);
        
        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        
        // Also clear from onlineUsers map
        const userInfo = onlineUsers.get(socket.id);
        if (userInfo) {
          userInfo.gameId = undefined;
        }

        // Update user status back to available
        if (userInfo) {
          userInfo.status = 'available';
          broadcastOnlineUsers(io);
        }

        console.log(`[leave_game] Handling opponent left for game ${gameId}`);

        // Handle opponent left logic
        await handleOpponentLeft(gameId, userId, io);
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('quit_game', async (data: { gameId: string; userId: string }) => {
      try {
        const { gameId, userId } = data;
        console.log(`[quit_game] User ${userId} quitting game ${gameId}`);
        
        const game = await gameService.getGameDetails(gameId);
        
        // Check if game is still in progress
        if (game.status !== 'in-progress') {
          console.log(`[quit_game] Game not in progress, status: ${game.status}`);
          return;
        }

        // Find the opponent
        const opponentPlayer = game.players.find((p) => p.userId !== userId);
        const quittingPlayer = game.players.find((p) => p.userId === userId);

        if (!opponentPlayer || !quittingPlayer) {
          console.log(`[quit_game] Could not find both players`);
          return;
        }

        console.log(`[quit_game] Opponent: ${opponentPlayer.userId}, Quitter: ${quittingPlayer.userId}`);

        // Mark opponent as winner
        await prisma.gamePlayer.update({
          where: { id: opponentPlayer.id },
          data: { isWinner: true, score: 100, completedAt: new Date() },
        });

        // Mark quitter as loser
        await prisma.gamePlayer.update({
          where: { id: quittingPlayer.id },
          data: { isWinner: false, score: 0, completedAt: new Date() },
        });

        // Update game status
        await prisma.game.update({
          where: { id: gameId },
          data: { status: 'completed' },
        });

        // Notify both players in the room - use the game: prefix format
        const roomName = `game:${gameId}`;
        console.log(`[quit_game] Emitting player_quit to room: ${roomName}`);
        io.to(roomName).emit('player_quit', {
          quitterId: userId,
          message: 'Opponent quit the game',
          winnerId: opponentPlayer.userId,
        });

        console.log(`[quit_game] Cleanup for game ${gameId}`);
        gameAnswers.delete(gameId);
      } catch (error) {
        console.error('[quit_game] Error handling quit game:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[disconnect] User disconnected: ${socket.id}`);
      
      // TEMPORARY TEST: Broadcast opponent_left to all clients to verify frontend receives it
      console.log(`[disconnect] TESTING: Broadcasting opponent_left to all clients`);
      io.emit('opponent_left', { result: 'win', gameId: socket.data.gameId, test: true });
      
      const userId = socket.data.userId as string | undefined;
      let gameId = socket.data.gameId as string | undefined;
      
      // If gameId not in socket.data, try to get it from onlineUsers map
      if (!gameId) {
        const userInfo = onlineUsers.get(socket.id);
        if (userInfo) {
          gameId = userInfo.gameId;
        }
      }

      console.log(`[disconnect] userId: ${userId}, gameId: ${gameId}`);

      // Handle opponent disconnect during game
      if (userId && gameId) {
        console.log(`[disconnect] Handling opponent left for game ${gameId}`);
        await handleOpponentLeft(gameId, userId, io);
      } else {
        console.log(`[disconnect] Not in a game, no action needed`);
      }

      if (onlineUsers.delete(socket.id)) {
        console.log(`[disconnect] User removed from online users map`);
        broadcastOnlineUsers(io);
      }
    });
  });
};
