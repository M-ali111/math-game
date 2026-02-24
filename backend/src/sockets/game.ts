import { Server, Socket } from 'socket.io';
import { gameService } from '../services/game';
import { questionService } from '../services/question';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { QuestionLanguage } from '../services/aiQuestion';

const prisma = new PrismaClient();
const gameAnswers = new Map<string, Map<string, boolean>>();
const onlineUsers = new Map<string, { userId: string; username: string }>();

const buildOnlineUsersList = (excludeUserId?: string) => {
  const uniqueUsers = new Map<string, { userId: string; username: string }>();
  for (const info of onlineUsers.values()) {
    if (excludeUserId && info.userId === excludeUserId) {
      continue;
    }
    if (!uniqueUsers.has(info.userId)) {
      uniqueUsers.set(info.userId, info);
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
        onlineUsers.set(socket.id, { userId: user.id, username: user.username });
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

        // Join socket room
        socket.join(`game:${gameId}`);

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
        }
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (onlineUsers.delete(socket.id)) {
        broadcastOnlineUsers(io);
      }
    });
  });
};
