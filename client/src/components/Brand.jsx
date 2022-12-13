import React from 'react'
import { brands } from '../constants'

const Brand = () => {
  return (
    <section className='sectionGlobal brand'>
        <h2 className='section__title'>
            Brands We Sell
        </h2>

        <div className=' grid-cols-[repeat(2,max-content)] justify-center !gap-x-[1.25rem] xs:grid-cols-[repeat(2,100px)] xs:gap-y-[.5rem]  containerGlobal gridGlobal'>
          {
            brands.map((brand)=>(
              <img key={brand.id} src={brand.img} alt="brand img" className=' w-[120px] even:mt-[2rem]'/>
            ))
          }
        </div>

    </section>
  )
}

export default Brand