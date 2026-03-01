import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function resetUsers() {
  console.log("Starting database reset...")
  
  const answers = await prisma.gameAnswer.deleteMany({})
  console.log(`Deleted ${answers.count} game answers`)
  
  const gameQuestions = await prisma.gameQuestion.deleteMany({})
  console.log(`Deleted ${gameQuestions.count} game questions`)
  
  const gamePlayers = await prisma.gamePlayer.deleteMany({})
  console.log(`Deleted ${gamePlayers.count} game players`)
  
  const games = await prisma.game.deleteMany({})
  console.log(`Deleted ${games.count} games`)
  
  const users = await prisma.user.deleteMany({})
  console.log(`Deleted ${users.count} users`)
  
  console.log("✅ Reset complete! Questions kept intact.")
  await prisma.$disconnect()
}

resetUsers().catch(console.error)
