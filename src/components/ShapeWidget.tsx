import React from 'react';
import { VisualWidget } from '../types';

interface ShapeWidgetProps {
  widget: VisualWidget;
  isSelected: boolean;
}

export const ShapeWidget: React.FC<ShapeWidgetProps> = ({ widget }) => {
  const fillColor = widget.shapeFillColor || widget.color || '#e0e7ff';
  const borderColor = widget.shapeBorderColor || 'transparent';
  const borderWidth = widget.shapeBorderWidth ?? 0;
  const borderStyle = widget.shapeBorderStyle || (borderWidth > 0 ? 'solid' : 'none');
  const opacity = (widget.cardOpacity ?? 100) / 100;
  const text = widget.shapeText || ''; // No text by default as requested!
  const textColor = widget.shapeTextColor || '#3730a3';
  const textSize = widget.shapeTextSize || 14;

  const renderShapeContent = () => {
    switch (widget.type) {
      case 'shape_circle':
        return (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-center transition"
            style={{
              backgroundColor: fillColor,
              borderColor: borderWidth > 0 ? borderColor : 'transparent',
              borderWidth: `${borderWidth}px`,
              borderStyle: borderStyle,
              opacity: opacity,
              color: textColor,
              fontSize: `${textSize}px`,
            }}
          >
            {text && <span className="p-2 font-medium break-words select-none">{text}</span>}
          </div>
        );

      case 'shape_pill':
        return (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-center transition"
            style={{
              backgroundColor: fillColor,
              borderColor: borderWidth > 0 ? borderColor : 'transparent',
              borderWidth: `${borderWidth}px`,
              borderStyle: borderStyle,
              opacity: opacity,
              color: textColor,
              fontSize: `${textSize}px`,
            }}
          >
            {text && <span className="px-4 py-1 font-medium break-words select-none">{text}</span>}
          </div>
        );

      case 'shape_rounded':
        return (
          <div
            className="w-full h-full rounded-2xl flex items-center justify-center text-center transition"
            style={{
              backgroundColor: fillColor,
              borderColor: borderWidth > 0 ? borderColor : 'transparent',
              borderWidth: `${borderWidth}px`,
              borderStyle: borderStyle,
              opacity: opacity,
              color: textColor,
              fontSize: `${textSize}px`,
            }}
          >
            {text && <span className="p-3 font-medium break-words select-none">{text}</span>}
          </div>
        );

      case 'shape_diamond':
        return (
          <div className="w-full h-full flex items-center justify-center relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ opacity }}
            >
              <polygon
                points="50,2 98,50 50,98 2,50"
                fill={fillColor}
                stroke={borderWidth > 0 ? borderColor : 'none'}
                strokeWidth={borderWidth}
              />
            </svg>
            {text && (
              <div
                className="absolute inset-0 flex items-center justify-center p-2 text-center select-none"
                style={{ color: textColor, fontSize: `${textSize}px` }}
              >
                {text}
              </div>
            )}
          </div>
        );

      case 'shape_triangle':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ opacity }}
            >
              <polygon
                points="50,4 96,96 4,96"
                fill={fillColor}
                stroke={borderWidth > 0 ? borderColor : 'none'}
                strokeWidth={borderWidth}
              />
            </svg>
            {text && (
              <div
                className="absolute inset-0 flex items-end justify-center pb-4 text-center select-none"
                style={{ color: textColor, fontSize: `${textSize}px` }}
              >
                {text}
              </div>
            )}
          </div>
        );

      case 'shape_star':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ opacity }}
            >
              <polygon
                points="50,4 64,35 98,35 70,56 81,88 50,68 19,88 30,56 2,35 36,35"
                fill={fillColor}
                stroke={borderWidth > 0 ? borderColor : 'none'}
                strokeWidth={borderWidth}
              />
            </svg>
            {text && (
              <div
                className="absolute inset-0 flex items-center justify-center p-2 text-center select-none"
                style={{ color: textColor, fontSize: `${textSize}px` }}
              >
                {text}
              </div>
            )}
          </div>
        );

      case 'shape_banner':
        return (
          <div className="w-full h-full flex items-center justify-center relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              style={{ opacity }}
            >
              <polygon
                points="0,0 100,0 90,20 100,40 0,40 10,20"
                fill={fillColor}
                stroke={borderWidth > 0 ? borderColor : 'none'}
                strokeWidth={borderWidth}
              />
            </svg>
            {text && (
              <div
                className="absolute inset-0 flex items-center justify-center px-4 text-center font-medium select-none"
                style={{ color: textColor, fontSize: `${textSize}px` }}
              >
                {text}
              </div>
            )}
          </div>
        );

      case 'shape_rect':
      default:
        return (
          <div
            className="w-full h-full rounded-md flex items-center justify-center text-center transition"
            style={{
              backgroundColor: fillColor,
              borderColor: borderWidth > 0 ? borderColor : 'transparent',
              borderWidth: `${borderWidth}px`,
              borderStyle: borderStyle,
              opacity: opacity,
              color: textColor,
              fontSize: `${textSize}px`,
            }}
          >
            {text && <span className="p-3 font-medium break-words select-none">{text}</span>}
          </div>
        );
    }
  };

  return <div className="w-full h-full relative overflow-hidden">{renderShapeContent()}</div>;
};
