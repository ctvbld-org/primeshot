'use client'

import React from 'react'

export function GenerationControls() {
  return (
    <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0 border border-dashed border-gray-500 p-4 rounded-md w-full md:w-auto">
      <select className="bg-gray-800 text-white p-2 rounded-md text-sm">
        <option>5 takes</option>
        <option>10 takes</option>
        <option>15 takes</option>
        <option>20 takes</option>
      </select>
      <select className="bg-gray-800 text-white p-2 rounded-md text-sm">
        <option>4:5</option>
        <option>1:1</option>
        <option>3:4</option>
      </select>
      <select className="bg-gray-800 text-white p-2 rounded-md text-sm">
        <option>Basic</option>
        <option>Standard</option>
        <option>High</option>
      </select>
      <button className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-md text-sm">Generate</button>
    </div>
  )
} 