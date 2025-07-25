import { useReducer, createContext, Dispatch, Children, ReactNode } from "react"
import { budgetReducer, initialState, type BudgetActions, type BudgetState } from "./budget-reducer"

type budgetContextProps ={
    state:BudgetState
    dispatch: Dispatch<BudgetActions>
}

type budgetProvederProps ={
    children:ReactNode
}

export const BudgetContext = createContext <budgetContextProps>({} as budgetContextProps)

export const BudgetProvider =({children}:budgetProvederProps)=> {

    const [state, dispatch]= useReducer(budgetReducer, initialState)

    return(
        <BudgetContext.Provider
            value={{
                state,
                dispatch
            }}
        >
            {Children}
        </BudgetContext.Provider>
    )
}