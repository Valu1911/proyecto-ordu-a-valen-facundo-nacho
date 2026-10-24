import React from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = 16,
  interactive = false,
  onChange,
  showValue = false,
  count = null,
}) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const currentScore = hoverRating || rating;

  return (
    <div className="sv-star-rating">
      <div className="sv-stars-row">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = currentScore >= starValue;
          const isHalf = !isFilled && currentScore >= starValue - 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              className={`sv-star-btn ${interactive ? 'is-interactive' : ''}`}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              aria-label={`${starValue} estrellas`}
            >
              <Star
                size={size}
                className={isFilled ? 'sv-star-filled' : isHalf ? 'sv-star-half' : 'sv-star-empty'}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="sv-star-value">{Number(rating).toFixed(1)}</span>
      )}
      {count !== null && (
        <span className="sv-star-count">({count})</span>
      )}
    </div>
  );
}
