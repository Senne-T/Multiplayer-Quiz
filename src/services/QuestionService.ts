import Question from "../models/Question"
import { IApiQuestion } from "../types/interfaces/IApiQuestion.ts"
import { displayAlert } from "../utils"
import { ICategory } from "../types/interfaces/ICategory.ts"

export class QuestionService {
  baseUrl: string = "https://opentdb.com/api.php?"
  categoryUrl: string = "https://opentdb.com/api_category.php"

  constructor() {}

  getCategories = async (): Promise<ICategory[]> => { // fetcht categorieën van de API en geeft ze terug als een array van ICategory
    try {
      const response = await fetch(this.categoryUrl)
      if (!response.ok) {
        throw new Error("Categorieën ophalen mislukt")
      }
      const data = await response.json()
      return data.trivia_categories as ICategory[]
    } catch (error) {
      displayAlert("Fout bij het ophalen van de categorieën")
      console.error(error)
      return []
    }
  }

  getQuestions = async (amount: number, category: number, difficulty: string): Promise<Question[]> => {
    try {
      const url = `${this.baseUrl}amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`
      const response = await fetch(url) //past de url aan met de parameters, en haalt de vragen op van de API
      
      if (!response.ok) {
        throw new Error("Vragen ophalen mislukt")
      }

      const data = await response.json()

      if (data.response_code !== 0) {
        displayAlert("Geen vragen gevonden voor deze categorie")
        return []
      }

      return this.mapQuestionsToQuestionModel(data.results as IApiQuestion[]) // zet de vragen om naar het juiste model
    } catch (error) {
      displayAlert("Fout bij het ophalen van de vragen")
      console.error(error)
      return []
    }
  }

  mapQuestionsToQuestionModel = (questions: IApiQuestion[]): Question[] => {
    let questionList: Question[] = []

    for (const q of questions) {
      const question = new Question(q.question)
      question.addAnswer({ text: q.correct_answer, isCorrect: true })
      q.incorrect_answers.forEach((a) => question.addAnswer({ text: a, isCorrect: false }))
      questionList.push(question)
    }

    return questionList
  }
}
