import Link from 'next/link'
import React from 'react'

export default function Navbar() {

  const items = [
    {
      name: 'Home',
      href: '/'
    },
    {
      name: 'About',
      href: '#about'
    },
    {
      name: 'services',
      href: '#services'
    },
    {
      name: 'testimonials',
      href: '#testimonials'
    },
    {
      name: 'contact',
      href: '#contact'
    },
    {
      name: 'How it works',
      href: '#how-it-works'
    },

  ]
  return (
    <div className='max-w-[90rem] mx-auto flex justify-between items-center fixed top-0 left-0 right-0 z-50 mt-8'>
      <div className="logo text-[#0D52FF] text-2xl font-bold cursor-pointer">Auditly360</div>
        <div className="Items justify-between py-4 px-16 bg-white/10 backdrop-blur-sm gap-12 flex flex-row rounded-2xl">
          {items.map((item) => (
            <Link href={item.href} key={item.name} className='text-md font-medium text-white  transition-colors duration-300 cursor-pointer' >
              {item.name}
            </Link>
          ))}
        </div>
      <div className="get-started-button cursor-pointer">
        <button className='bg-transparent border border-white text-white px-8 py-4 rounded-2xl cursor-pointer'>Get Started</button>
      </div>
    </div>
  )
}
