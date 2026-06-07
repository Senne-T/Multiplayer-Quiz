import { quiz, quizPage } from "../globals.ts"
import { QuestionMode } from "../types/enum/QuestionMode.ts"
import { QuestionService } from "../services/QuestionService.ts"
import { ICategory } from "../types/interfaces/ICategory.ts"
import { IAnswer } from "../types/interfaces/IAnswer.ts"
import { Difficulty } from "../types/enum/Difficulty.ts"
import { disableEl, displayAlert, enableEl, getElementWrapper } from "../utils"
import Question from "../models/Question.ts"

const questionService = new QuestionService()

// language=HTML
const apiModeHtml: string = `
    <h2>API questions</h2>
    <p>Configure the API for retrieving questions</p>
    <select class="form-select" id="input-difficulty" data-testid="input-difficulty"></select>
    <select class="form-select mt-2" id="input-category" data-testid="input-category"></select>
    <button id="btn-fetch-questions" class="btn btn-primary mt-2" data-testid="btn-fetch-questions">Fetch questions</button>`

// language=HTML
const customModeHtml: string = `
    <h2>Custom questions</h2>
    <div class="row mb-3">
        <label for="input-question" class="col-sm-2 col-form-label">Question</label>
        <div class="col-sm-10">
            <input class="form-control" id="input-question" data-testid="input-question">
        </div>
    </div>
    <div class="row mb-3">
        <label for="input-correct-answer" class="col-sm-2 col-form-label">Correct answer</label>
        <div class="col-sm-10">
            <input class="form-control" id="input-correct-answer" data-testid="input-correct-answer">
        </div>
    </div>
    <div class="row mb-3">
        <label for="input-incorrect-answer" class="col-sm-2 col-form-label">Incorrect answer</label>
        <div class="col-sm-10">
            <div class="input-group">
                <input id="input-incorrect-answer" type="text" class="form-control" aria-label="Recipient's username"
                       aria-describedby="button-addon2" data-testid="input-incorrect-answer">
                <button class="btn btn-outline-secondary" type="button" id="btn-add-incorrect-answer" data-testid="btn-add-incorrect-answer">Add</button>
            </div>
        </div>
    </div>
    <table class="table table-bordered">
        <thead>
        <tr>
            <th scope="col">Question</th>
            <th scope="col">Correct answer</th>
            <th scope="col">Incorrect answers</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td id="output-question" data-testid="output-question"></td>
            <td>
                <ul id="output-correct-answer" data-testid="output-correct-answer">
                </ul>
            </td>
            <td>
                <ul id="output-incorrect-answers" data-testid="output-incorrect-answers">
                </ul>
            </td>
        </tr>
        </tbody>
    </table>
    <button type="submit" class="btn btn-primary" id="btn-submit-question" data-testid="btn-submit-question">Submit question</button>
`

//language=HTML
const questionsHtml: string = `
    <h2 class="mt-2">Confirmed questions <span id="question-counter" data-testid="question-counter">(0/0)</span></h2>
    <div id="questions" data-testid="questions">No questions to display</div>
`

// Selectionmenu met categorieën opvullen
const fillCategories = async () => {
  const select = getElementWrapper<HTMLSelectElement>("#input-category")
  const categories = await questionService.getCategories()
  categories.forEach((c: ICategory) => {
    const option = document.createElement("option")
    option.value = c.id.toString()
    option.text = c.name
    select.appendChild(option)
  })
}

// Selectionmenu met moeilijkheidsgraad opvullen
const fillDifficulty = async () => {
  const select = getElementWrapper<HTMLSelectElement>("#input-difficulty")
  Object.keys(Difficulty).forEach((key) => {
    const option = document.createElement("option")
    option.value = key.toLowerCase()
    option.text = key
    select.appendChild(option)
  })
}

let incorrectAnswers: IAnswer[] = []

export class QuestionsPage {
  private tempQuestion = new Question("")

  public constructor() {}

  public init(contentElement: HTMLElement) {
    //language=HTML
    let htmlToShow = quiz.getQuestionMode() === QuestionMode.Api ? apiModeHtml : customModeHtml
    const fullHtml = `
            <div class="row">
                <div class="col">
                    <p data-testid="intro">A quiz can not start without questions. Add questions to the quiz by fetching them from an API or by adding them manually.</p>
                </div>
            </div>
            <div class="row">
                <div class="col">${htmlToShow}</div>
                <div class="col">${questionsHtml}</div>
            </div>
            <hr>
            <div class="row">
                <div class="col">
                    <button class="btn btn-success w-100" id="btn-start-quiz" data-testid="btn-start-quiz" disabled>Start quiz</button>
                </div>
            </div>
        `
    contentElement.innerHTML = fullHtml

    getElementWrapper<HTMLButtonElement>("#btn-start-quiz").addEventListener("click", () =>
      quizPage.init(getElementWrapper("#content"))
    )

    this.updateQuestionList()

    if (quiz.getQuestionMode() === QuestionMode.Api) {
      getElementWrapper<HTMLButtonElement>("#btn-fetch-questions").addEventListener("click", () =>
        this.fetchQuestions()
      )
      fillDifficulty()
      fillCategories()
    }

    if (quiz.getQuestionMode() === QuestionMode.Custom) {
      getElementWrapper<HTMLButtonElement>("#btn-add-incorrect-answer").addEventListener("click", () =>
        this.addIncorrectAnswer(incorrectAnswers)
      )
      getElementWrapper<HTMLButtonElement>("#btn-submit-question").addEventListener("click", () => this.addQuestion())

      const inputQuestion = getElementWrapper<HTMLInputElement>("#input-question")
      const inputCorrectAnswer = getElementWrapper<HTMLInputElement>("#input-correct-answer")
      const outputQuestion = getElementWrapper<HTMLElement>("#output-question")
      const outputCorrectAnswer = getElementWrapper<HTMLElement>("#output-correct-answer")

      inputQuestion.addEventListener("input", () => {
        outputQuestion.textContent = inputQuestion.value
      })

      inputCorrectAnswer.addEventListener("input", () => {
        outputCorrectAnswer.innerHTML = `<li>${inputCorrectAnswer.value}</li>`
      })
    }
  }

  // Vragen ophalen via de API
  private fetchQuestions = async () => {
    if (quiz.getQuestionMode() === QuestionMode.Custom) return

    const selectedDifficulty = getElementWrapper<HTMLSelectElement>("#input-difficulty")
    const selectedCategory = getElementWrapper<HTMLSelectElement>("#input-category")

    const category = parseInt(selectedCategory.value)
    const difficulty = selectedDifficulty.value
    const quizDuration = quiz.quizDuration

    const questions = await questionService.getQuestions(quizDuration, category, difficulty)
    quiz.questions = [] // Reset the questions array

    for (const q of questions) {
      quiz.addQuestion(q)
    }

    this.updateQuestionList()
    this.updateStartQuizButton()
  }

  // Validatie van de vraagvelden, geeft een foutmelding als er velden ongeldig zijn
  private validateQuestionFields = (): boolean => {
    const inputQuestion = getElementWrapper<HTMLInputElement>("#input-question")
    const inputCorrectAnswer = getElementWrapper<HTMLInputElement>("#input-correct-answer")

    const questionLength = inputQuestion.value.split(" ").length

    if (questionLength < 4) {
      displayAlert("Question should contain at least 4 words")
      return false
    }

    if (inputCorrectAnswer.value === "") {
      displayAlert("Question should contain at least 1 correct answer which can not be empty")
      return false
    }

    if (incorrectAnswers.length < 2) {
      displayAlert("Question should contain at least 2 incorrect answers")
      return false
    }

    return true
  }

  // Validatie van het incorrecte antwoord, geeft een foutmelding als het veld ongeldig is
  private validateIncorrectAnswer = (): boolean => {
    const inputIncorrectAnswer = getElementWrapper<HTMLInputElement>("#input-incorrect-answer")

    if (inputIncorrectAnswer.value === "") {
      displayAlert("Incorrect answer can not be empty")
      return false
    }

    return true
  }

  // Vraag toevoegen aan de quiz
  private addQuestion() {
    if (!this.validateQuestionFields()) {
      return
    }
    const inputQuestion = getElementWrapper<HTMLInputElement>("#input-question")
    const inputCorrectAnswer = getElementWrapper<HTMLInputElement>("#input-correct-answer")

    const questionText = inputQuestion.value
    const correctAnswer: IAnswer = {
      text: inputCorrectAnswer.value,
      isCorrect: true,
    }

    let answers: IAnswer[] = []
    answers.push(correctAnswer)

    this.tempQuestion.question = questionText
    this.tempQuestion.addAnswer(correctAnswer)
    incorrectAnswers.forEach((a) => {
      this.tempQuestion.addAnswer(a)
      answers.push(a)
    })

    quiz.addQuestion(this.tempQuestion)

    this.updateQuestionList()
    this.updateStartQuizButton()
    this.cleanQuestionFields()

    // // Indien de max aantal vragen is bereikt, wordt de knop om een vraag toe te voegen uitgeschakeld
    if (quiz.questions.length >= quiz.quizDuration) {
      const btnSubmitQuesstion = getElementWrapper<HTMLButtonElement>("#btn-submit-question")
      disableEl(btnSubmitQuesstion)
    }
  }

  // Oncorrect antwoord toevoegen aan de vraag
  private addIncorrectAnswer(incorrectAnswers: IAnswer[]) {
    if (!this.validateIncorrectAnswer()) {
      return
    }
    const outputIncorrectAnswers = getElementWrapper<HTMLUListElement>("#output-incorrect-answers")
    const inputIncorrectAnswer = getElementWrapper<HTMLInputElement>("#input-incorrect-answer")
    const li = document.createElement("li")

    const incorrectAnswer: IAnswer = {
      text: inputIncorrectAnswer.value,
      isCorrect: false,
    }
    li.textContent = incorrectAnswer.text
    outputIncorrectAnswers.appendChild(li)
    incorrectAnswers.push(incorrectAnswer)

    inputIncorrectAnswer.value = ""
  }

  // Velden van de vraag schoonmaken
  private cleanQuestionFields() {
    const inputQuestion = getElementWrapper<HTMLInputElement>("#input-question")
    const inputCorrectAnswer = getElementWrapper<HTMLInputElement>("#input-correct-answer")
    const inputIncorrectAnswer = getElementWrapper<HTMLInputElement>("#input-incorrect-answer")
    const outputQuestion = getElementWrapper<HTMLElement>("#output-question")
    const outputCorrectAnswer = getElementWrapper<HTMLUListElement>("#output-correct-answer")
    const outputIncorrectAnswers = getElementWrapper<HTMLUListElement>("#output-incorrect-answers")

    inputQuestion.value = ""
    inputCorrectAnswer.value = ""
    inputIncorrectAnswer.value = ""
    outputQuestion.textContent = ""
    outputCorrectAnswer.innerHTML = ""
    outputIncorrectAnswers.innerHTML = ""
    incorrectAnswers = []
    this.tempQuestion = new Question("")
  }

  // Vragenlijst die wordt getoond bijwerken
  private updateQuestionList() {
    const questionCounter = getElementWrapper<HTMLSpanElement>("#question-counter")
    questionCounter.textContent = `(${quiz.questions.length}/${quiz.quizDuration})`

    const questionDiv = getElementWrapper<HTMLUListElement>("#questions")
    const questionList = document.createElement("ul")

    if (quiz.questions.length > 0) {
      quiz.questions.forEach((q) => {
        const li = document.createElement("li")
        li.textContent = q.toString()
        questionList.appendChild(li)
      })
      questionDiv.innerHTML = ""
      questionDiv.appendChild(questionList)
    }
  }

  // Startknop voor de quiz bijwerken indien er voldoende vragen zijn toegevoegd
  private updateStartQuizButton() {
    const btnStartQuiz = getElementWrapper<HTMLButtonElement>("#btn-start-quiz")

    if (quiz.questions.length === quiz.quizDuration) enableEl(btnStartQuiz)
  }
}
