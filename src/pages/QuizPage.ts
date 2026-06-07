// language=HTML
import { getElementWrapper } from "../utils"
import { quiz, scoreboardPage } from "../globals.ts"
import { GameMode } from "../types/enum/GameMode.ts"

const html: string = `
    <div class="row">
        <div class="col">
            <p data-testid="intro">Try to score as many points as possible by answering the questions correctly. Good
                luck!</p>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <div id="current-player-container" class="" data-testid="current-player-container">
                <p><span class="fw-bold">Current player: </span><span id="current-player-name"
                                                                      data-testid="current-player-name"></span></p>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <div id="quiz-container" class="" data-testid="quiz-container">
                <!-- Quiz content will be displayed here -->
                <p><span class="fw-bold">Question: </span><span id="question" data-testid="question"></span>
                </p>
                <p class="fw-bold">Select the correct answer!</p>
                <div id="answer-container" class="mb-3" data-testid="answer-container"></div>
                <button id="btn-submit-answer" class="btn btn-success" data-testid="btn-submit-answer">Submit Answer
                </button>
            </div>
        </div>
    </div>
`

let questionCounter: number = 0
let playersAmount: number

export class QuizPage {
  private waitUntilQuizStops(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!quiz.isRunning) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100) // Check every 100ms
    })
  }
  public constructor() {}

  public init(element: HTMLElement) {
    element.innerHTML = html
    quiz.startQuiz()
    this.updatePlayerName()
    this.updateCurrentQuestion()

    getElementWrapper<HTMLButtonElement>("#btn-submit-answer").addEventListener("click", () => this.submitAnswer())
    playersAmount = quiz.players.length

    this.waitUntilQuizStops().then(() => {
      scoreboardPage.init(getElementWrapper("#content"))
    })
  }

  // Spelernaam updaten als een speler klaar is met zijn beurt
  private updatePlayerName() {
    const currentPlayerName = getElementWrapper<HTMLSpanElement>("#current-player-name")
    currentPlayerName.innerText = quiz.getCurrentPlayerName()
  }

  // Geselecteerde antwoord indienen + naar volgende vraag gaan + score bijwerken
  private submitAnswer() {
    const answer = getElementWrapper<HTMLInputElement>("input:checked")
    if (quiz.testIfAnswerIsCorrect(answer.value)) {
      quiz.updateCurrentPlayerScore(1)
    }

    quiz.nextQuestion()
    
    if (quiz.isRunning) {
      this.updatePlayerName()
      this.updateCurrentQuestion()
    }
  }

  // Volgende vraag tonen
  private updateCurrentQuestion() {
    const currentQuestion = quiz.getCurrentQuestion()
    // Show the current question
    getElementWrapper<HTMLHeadingElement>("#question").innerText = currentQuestion.question
    const answers = currentQuestion.answers
    const answerContainer = getElementWrapper<HTMLDivElement>("#answer-container")
    // Clear previous answers
    answerContainer.innerHTML = ""
    // Show all possible answers
    answers.forEach((answer) => {
      // Create the holding div
      const formCheck = document.createElement("div")
      formCheck.className = "form-check"
      // Create the radio input
      const radioInput = document.createElement("input")
      radioInput.type = "radio"
      radioInput.className = "form-check-input"
      radioInput.name = "answer"
      radioInput.value = answer.text
      // Create the label
      const label = document.createElement("label")
      label.className = "form-check-label"
      label.appendChild(radioInput)
      label.appendChild(document.createTextNode(answer.text))
      formCheck.appendChild(label)
      // Append to the answer container
      answerContainer.appendChild(formCheck)
    })
  }
}
