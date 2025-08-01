import { useMemo } from "react"
import { useBudget } from "../hook/useBudget"
import ExpenseDetail from "./ExpenseDetail"

export default function ExpenseList() {
    const {state} = useBudget()

    const filterExpenses = state.currentCategory ? state.expenses.filter(expense => expense.category === state.currentCategory): state.expenses
        const isEmpty = useMemo(() =>filterExpenses.length ===0, [filterExpenses] )

  return (
    <div className="mt-10">
        {isEmpty ? <p className="text-gray-90 text-2xl font-bold" >No hay Gastos</p> : (
            <>
            <p className="text-gray-90 text-2xl font-bold">Listado de Gastos.</p>
            {filterExpenses.map( expense => (
                <ExpenseDetail
                    key={expense.id}
                    expense={expense}
                />
            ))}
            </>
        )}
    </div>
  )
}
