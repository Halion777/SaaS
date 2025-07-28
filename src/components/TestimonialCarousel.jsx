import React, { useState, useRef } from 'react';
import Icon from './AppIcon';

const TestimonialCarousel = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const getVisibleSlides = () => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  const visibleSlides = getVisibleSlides();
  const totalSlides = testimonials.length;
  const maxIndex = Math.max(0, totalSlides - visibleSlides);

  // Get the testimonials to display based on current index
  const getVisibleTestimonials = () => {
    const endIndex = Math.min(currentIndex + visibleSlides, testimonials.length);
    return testimonials.slice(currentIndex, endIndex);
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getVisibleTestimonials().map((testimonial, index) => (
            <div key={index} className="w-full">
              <div className="relative bg-white rounded-2xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 h-full border border-gray-100 hover:border-[#0036ab]/30 group transform hover:-translate-y-2">
                {/* Floating Badge */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#0036ab] to-[#12bf23] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg z-10">
                  ⭐ 5.0
                </div>

                {/* Quote Icon with Enhanced Design */}
                <div className="mb-8">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0036ab]/10 to-[#12bf23]/10 rounded-2xl flex items-center justify-center shadow-lg">
                      <Icon name="Quote" size={28} className="text-[#0036ab]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#12bf23] rounded-full flex items-center justify-center">
                      <Icon name="CheckCircle" size={12} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Stars Rating with Enhanced Styling */}
                <div className="flex items-center mb-6">
                  <div className="flex items-center mr-3">
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} name="Star" size={20} className="text-yellow-400 fill-current mr-1 drop-shadow-sm" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600">Excellent</span>
                </div>

                {/* Testimonial Text with Better Typography */}
                <div className="relative mb-8">
                  <p className="text-gray-700 italic text-base lg:text-lg leading-relaxed font-medium">
                    "{testimonial.quote}"
                  </p>
                  <div className="absolute -bottom-2 right-0 text-6xl text-[#0036ab]/10 font-serif">"</div>
                </div>

                {/* Author Info with Enhanced Design */}
                <div className="flex items-center">
                  <div className="relative">
                    <div className={`w-16 h-16 lg:w-18 lg:h-18 ${testimonial.color} rounded-2xl flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      {testimonial.initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#12bf23] rounded-full border-2 border-white flex items-center justify-center">
                      <Icon name="CheckCircle" size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-gray-900 text-base lg:text-lg">{testimonial.name}</div>
                    <div className="text-[#0036ab] text-sm lg:text-base font-semibold">{testimonial.profession}</div>
                    <div className="text-gray-500 text-xs mt-1">Client vérifié</div>
                  </div>
                </div>

                {/* Hover Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0036ab]/5 to-[#12bf23]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0036ab]/10 to-transparent rounded-bl-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Navigation Arrows */}
      {totalSlides > visibleSlides && (
        <>
          <button 
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 bg-white border-2 border-gray-200 rounded-full p-5 shadow-xl hover:shadow-2xl transition-all duration-300 z-20 hover:bg-gray-50 hover:border-[#0036ab] group hover:scale-110"
            onClick={prevSlide}
            aria-label="Previous testimonial"
          >
            <Icon name="ChevronLeft" size={28} className="text-gray-600 group-hover:text-[#0036ab] transition-colors" />
          </button>
          
          <button 
            className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-white border-2 border-gray-200 rounded-full p-5 shadow-xl hover:shadow-2xl transition-all duration-300 z-20 hover:bg-gray-50 hover:border-[#0036ab] group hover:scale-110"
            onClick={nextSlide}
            aria-label="Next testimonial"
          >
            <Icon name="ChevronRight" size={28} className="text-gray-600 group-hover:text-[#0036ab] transition-colors" />
          </button>
        </>
      )}

      {/* Enhanced Dots Indicator */}
      <div className="flex justify-center mt-16 space-x-4">
        {Array.from({ length: maxIndex + 1 }, (_, index) => (
          <button
            key={index}
            className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-gradient-to-r from-[#0036ab] to-[#12bf23] scale-125 shadow-lg' 
                : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Testimonial Counter */}
      <div className="text-center mt-8">
        <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200">
          <Icon name="Users" size={16} className="text-[#0036ab] mr-2" />
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} sur {totalSlides} témoignages
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCarousel; 