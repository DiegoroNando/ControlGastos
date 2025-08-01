import { useReducer, createContext, Dispatch, Children, ReactNode, useMemo } from "react"
import { budgetReducer, initialState, type BudgetActions, type BudgetState } from "./budget-reducer"

type budgetContextProps ={
    state:BudgetState
    dispatch: Dispatch<BudgetActions>
    totalExpenses: number
    remainingBudget: number
}

type budgetProvederProps ={
    children:ReactNode
}

export const BudgetContext = createContext <budgetContextProps>({} as budgetContextProps)

export const BudgetProvider =({children}:budgetProvederProps)=> {

    const [state, dispatch]= useReducer(budgetReducer, initialState)
    const totalExpenses = useMemo(()=> state.expenses.reduce((total, expense)=> expense.amount + total, 0), 
    [state.expenses])
    const remainingBudget = state.budget - totalExpenses

    return(
        <BudgetContext.Provider
            value={{
                state,
                dispatch,
                totalExpenses,
                remainingBudget
            }}
        >
            {children}
        </BudgetContext.Provider>
    )
}