import { useEffect, useState, type ChangeEvent } from "react";
import {  DraftExpense, type Value } from "../types";
import { categories } from "../data/categories";
import DatePicker from 'react-date-picker';
import 'react-calendar/dist/Calendar.css'
import 'react-date-picker/dist/DatePicker.css'
import ErrorMessage from "./ErrorMessage";
import { useBudget } from "../hook/useBudget";

export default function ExpenseForm() {

  const [expense, setExpense] = useState <DraftExpense>({
    amount: 0,
    expenseName:'',
    category:'',
    date: new Date()
})

  const [error, setError]= useState('')
  const {dispatch, state, remainingBudget}= useBudget()
   const [previousAmount, setPreviousAmount] = useState(0)

     useEffect(() => {
        if(state.editingId) {
            const editingExpense = state.expenses.filter( currentExpense => currentExpense.id === state.editingId )[0]
            setExpense(editingExpense)
            setPreviousAmount (expense.amount)
        }
    }, [state.editingId])

const handleChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>)=>{
  const {name, value}= e.target
  const isAmountField = ['amount'].includes(name)
    setExpense({
      ...expense,
      [name] : isAmountField ? +value :value
    })
}

const handleChangeDate = (value : Value) => {
    setExpense({
      ...expense,
      date:value
    })
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault()

    //validar
  if(Object.values(expense).includes('')){
    setError('Todos los campos son obligatorios')
    return
  }

  //validar no pasar el presupuesto
  if ((expense.amount - previousAmount )> remainingBudget ) {
    setError('Ese gasto sale del presupuesto')
    return
  }

   //Actualizar Gasto

   if (state.editingId) {
      dispatch({type:'update-expense', payload:{expense:{id: state.editingId, ...expense}}})
   }else{
        //Agregar un nuevo gasto
    dispatch({type:'add-expense', payload:{expense}})
   }

  
  {} //Reiniciar Modal
  //setExpense({
   //   amount: 0,
  //    expenseName:'',
   //   category:'',
   //   date: new Date()
 //     })
      setPreviousAmount(0)
}

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <legend className="Uppercase text-center text-2xl font-black border-b-4 border-blue-500 py-2">
        {state.editingId ? 'Editando Gasto': 'Nuevo Gasto'}
      </legend>

      {error && <ErrorMessage>{error}</ErrorMessage>}



      <div className="flex flex-col gap-2">
          <label htmlFor="expenseName"
                 className="text-xl"
          > Nombre del Gasto</label>
          <input type="text"
                  id="expenseName"
                  placeholder="Añade el Nombre del Gasto"
                  className="bg-slate-100 p-2"
                  name="expenseName"
                  onChange={handleChange}
                  value={expense.expenseName}
          />
      </div>

      <div className="flex flex-col gap-2">
          <label htmlFor="amount"
                 className="text-xl"
          > Cantidad del Gasto:</label>
          <input type="number"
                  id="amount"
                  placeholder="Añade la Cantidad del Gasto: ej. 300"
                  className="bg-slate-100 p-2"
                  name="amount"
                 onChange={handleChange}
                 value={expense.amount}
          />
      </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category"
                 className="text-xl"
          > Categoria:</label>
          <select 
                  id="category"
                  className="bg-slate-100 p-2"
                  name="category"
                  onChange={handleChange}
                  value={expense.category}
          >

            <option value="">--Seleccione--</option>
                {categories.map(category =>(
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
          </select>
      </div>
      <div className="flex flex-col gap-2">
              <label htmlFor="date"
                    className="text-xl"
              > Fecha Gasto: </label>
            <DatePicker 
            className="bg-slate-100 p-2 border-0"
            value={expense.date}
            onChange={handleChangeDate}
            />
      </div>

          <input 
          type="submit" 
          className="w-full p-2 text-white bg-blue-600 uppercase cursor-pointer font-bold rounded-lg"
          value={state.editingId ? 'Guardar Cambios' : 'Guardar Cambios'}
          />
    </form>
  )
}
