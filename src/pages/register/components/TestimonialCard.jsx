import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TestimonialCard = ({ testimonial }) => {
  
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="Star"
        size={16}
        color={index < rating ? "var(--color-accent)" : "var(--color-muted-foreground)"}
        fill={index < rating ? "var(--color-accent)" : "none"}
        strokeWidth={index < rating ? 1.5 : 2}
      />
    ));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center space-x-1 mb-4">
        {renderStars(testimonial.rating)}
      </div>
      
      <blockquote className="text-foreground mb-4 italic">
        "{testimonial.quote}"
      </blockquote>
      
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">
            {testimonial.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {testimonial.trade} • {testimonial.location}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;