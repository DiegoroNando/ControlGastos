import { useContext } from "react"
import { BudgetContext } from "../reducers/BudgetContext"

export const useBudget = () =>{
    const context = useContext(BudgetContext)

    if(!context){
        throw new Error('useBudget must be use within a BudgetProvider')
    }
    return context
    
}