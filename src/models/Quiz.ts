import Question from "./Question"
import Player from "./Player"
import { QuestionMode } from "../types/enum/QuestionMode"
import { GameMode } from "../types/enum/GameMode.ts"

export class Quiz {
  public isRunning: boolean = false
  public questions: Question[] = []
  public quizDuration: number = 0
  public players: Player[] = []
  private currentQuestionIndex: number = 0 
  private currentPlayerIndex: number = 0
  private gameMode: GameMode = GameMode.Single
  public questionMode: QuestionMode = QuestionMode.Custom
  private playersRemaining: number
  private numberOfPlayers: number = 1
  private totalAmountOfQuestionToBeAsked: number = 0
  private amountOfQuestionsAlreadyAsked: number = 0

  public constructor(duration: number = 1) {
    this.quizDuration = duration
    this.playersRemaining = duration
  }

  public getGameMode() {
    return this.gameMode
  }

  public getQuestionMode(): QuestionMode {
    return this.questionMode
  }

  public getNumberOfPlayers(): number {
    return this.numberOfPlayers
  }

  public getCurrentPlayerName(): string {
    return this.players[this.currentPlayerIndex].name
  }

  public getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex]
  }

  public updateCurrentPlayerScore(amount: number) {
    this.players[this.currentPlayerIndex].score += amount
  }

  public setQuestionMode(mode: QuestionMode) {
    this.questionMode = mode
  }

  private updateTotalAmountOfQuestionToBeAsked() {
    this.amountOfQuestionsAlreadyAsked++
    this.totalAmountOfQuestionToBeAsked--
  }

  public addQuestion(q: Question) {
    this.questions.push(q)
  }

  public addPlayer(name: string) {
    this.players.push(new Player(name))
  }

  private getAmountOfPlayers() {
    return this.players.length
  }

  public removePlayer(name: string) {
    const playerIndex = this.players.findIndex((p) => p.name === name)
    this.players.splice(playerIndex, 1)
  }

  public startQuiz() {
    this.totalAmountOfQuestionToBeAsked = this.questions.length
    this.playersRemaining = this.players.length
    this.isRunning = true
  }

  public testIfAnswerIsCorrect(answer: string) {
    // Zoekt de juiste antwoorden op bij de vraag, waarna kijkt hij na of het gevonden antwoord correct is
    const foundAnswer = this.questions[this.currentQuestionIndex].answers.find((a) => a.text === answer)
    return foundAnswer!.isCorrect === true
  }

  public nextQuestion() {
    this.updateTotalAmountOfQuestionToBeAsked()
    this.currentQuestionIndex++

    if (this.getAmountOfPlayers() === 1) {
      this.quizDuration--
    }

    if (this.getAmountOfPlayers() > 1) {
      this.quizDuration--
      if (this.totalAmountOfQuestionToBeAsked === 0 && this.playersRemaining > 1) {
        this.playersRemaining--  
        this.currentQuestionIndex = 0
        this.currentPlayerIndex++
        this.totalAmountOfQuestionToBeAsked = this.questions.length
        this.amountOfQuestionsAlreadyAsked = 0
        this.quizDuration = this.questions.length
      }
    }

    if (this.quizDuration === 0 && this.totalAmountOfQuestionToBeAsked === 0) {
      this.endQuiz()
    }
  }

  private shuffleAnswersInQuestions() {
    this.questions.forEach((question) => {
      question.answers = question.answers.sort(() => Math.random() - 0.5)
    })
  }

  private endQuiz() {
    this.isRunning = false
  }

  public setGameMode(gameMode: GameMode, amountOfPlayers: number) {
    this.gameMode = gameMode

    if (amountOfPlayers === undefined) {
      this.numberOfPlayers = 1
    }
    this.numberOfPlayers = amountOfPlayers
  }

  public sortPlayersByScore() {
    const sortedplayers = this.players.sort((a, b) => {
      if (a.score > b.score) {
        return -1
      } else if (a.score < b.score) {
        return 1
      } else {
        return 0
      }
    })
    return sortedplayers
  }

  public resetGame() {
    this.isRunning = false
    this.questions = []
    this.players = []
    this.quizDuration = 0
    this.totalAmountOfQuestionToBeAsked = 0
    this.amountOfQuestionsAlreadyAsked = 0
    this.numberOfPlayers = 1
    this.currentPlayerIndex = 0
    this.currentQuestionIndex = 0
    this.gameMode = GameMode.Single
    this.questionMode = QuestionMode.Custom
  }
}
