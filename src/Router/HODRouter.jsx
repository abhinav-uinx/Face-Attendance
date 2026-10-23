import React from 'react'
import { Route, Routes } from "react-router-dom";
import HODProfileEdit from '../HOD/HODProfileEdit';

const HODRouter = () => {
  return (
    <div>

<Routes>
<Route path="HODProfileEdit" element={<HODProfileEdit />} />



</Routes>

    </div>
  )
}

export default HODRouter