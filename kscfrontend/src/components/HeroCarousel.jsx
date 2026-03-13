import { useState, useEffect } from "react";
import OptimizedImage from "./OptimizedImage";

/**
 * HeroCarousel - Displays hero images as an automatic carousel (for slide type heroes)
 * Supports autoplay and manual navigation
 */
export default function HeroCarousel({
  slides = [],
  autoplayInterval = 5000,
  height = 500,
  className = "hero-carousel"
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  // Responsive height: clamp half the given height at minimum on small screens
  const responsiveHeight = typeof height === "number"
    ? `clamp(${Math.floor(height / 2)}px, 50vw, ${height}px)`
    : height;

  // Filter for active slides
  const activeSlides = slides.filter(s => s.active !== false);

  // Autoplay timer — must be before any early return (rules of hooks)
  useEffect(() => {
    if (!isAutoplay || activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [isAutoplay, activeSlides.length, autoplayInterval]);

  if (activeSlides.length === 0) return null;

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoplay(false);
    // Resume autoplay after 10 seconds of inactivity
    const timer = setTimeout(() => setIsAutoplay(true), 10000);
    return () => clearTimeout(timer);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    setIsAutoplay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    setIsAutoplay(false);
  };

  const currentSlide = activeSlides[currentIndex];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100vw",
        marginLeft: "50%",
        transform: "translateX(-50%)",
        height: responsiveHeight,
        overflow: "hidden",
        background: "#f0f0f0",
      }}
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {/* Slides */}
      {activeSlides.map((slide, idx) => (
        <div
          key={slide._id || idx}
          style={{
            position: "absolute",
            inset: 0,
            opacity: idx === currentIndex ? 1 : 0,
            transition: "opacity 0.6s ease-in-out",
            zIndex: idx === currentIndex ? 1 : 0,
          }}
        >
          <OptimizedImage
            src={slide.url}
            alt={slide.title || "Hero slide"}
            priority={idx === 0}
            fetchPriority={idx === 0 ? "high" : "low"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
          zIndex: 2,
        }}
      />

      {/* Text overlay */}
      {currentSlide.title && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              maxWidth: 720,
              width: "100%",
              padding: "16px 20px",
              borderRadius: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            <h2 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>
              {currentSlide.title}
            </h2>
            {currentSlide.description && (
              <p style={{ margin: 0, fontSize: "1.1rem" }}>
                {currentSlide.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation controls - only show if more than one slide */}
      {activeSlides.length > 1 && (
        <>
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 4,
              background: "rgba(255, 255, 255, 0.8)",
              border: "none",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "rgba(255, 255, 255, 1)")}
            onMouseLeave={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.8)")}
            aria-label="Previous hero slide"
          >
            ‹
          </button>

          {/* Next button */}
          <button
            onClick={goToNext}
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 4,
              background: "rgba(255, 255, 255, 0.8)",
              border: "none",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "rgba(255, 255, 255, 1)")}
            onMouseLeave={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.8)")}
            aria-label="Next hero slide"
          >
            ›
          </button>

          {/* Dot indicators */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 4,
              display: "flex",
              gap: "10px",
            }}
          >
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  border: "none",
                  background: idx === currentIndex ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
