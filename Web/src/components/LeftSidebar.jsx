import { Crop, Palette, Sliders, Type, Lock } from 'lucide-react';
import PropTypes from 'prop-types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'; // Assuming path to shadcn/ui or similar components

const tools = [
  { id: 'crop', icon: Crop, label: 'Crop' },
  { id: 'filters', icon: Palette, label: 'Filters' },
  { id: 'adjustments', icon: Sliders, label: 'Adjustments' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'steganography', icon: Lock, label: 'Steganography' },
];

export default function LeftSidebar({ selectedTool, onToolSelect }) {
  return (
    <div
      className="w-20 glass-panel border-r flex flex-col items-center py-6 gap-4"
      style={{ borderColor: 'var(--editor-border)' }}
    >
      <TooltipProvider>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          const handleSelect = () => {
            if (isSelected) {
              onToolSelect(null); // deselect if already active
            } else {
              onToolSelect(tool.id); // activate new tool
            }
          };

          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSelect}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isSelected ? 'neon-glow' : 'hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--editor-neon-blue)'
                      : 'rgba(31, 111, 235, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        'rgba(31, 111, 235, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        'rgba(31, 111, 235, 0.1)';
                    }
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{
                      color: isSelected
                        ? '#ffffff'
                        : 'var(--editor-text-muted)',
                    }}
                    strokeWidth={1.5}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="glass-panel"
                style={{ borderColor: 'var(--editor-neon-blue)' }}
              >
                <p style={{ color: 'var(--editor-text)' }}>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

// Add PropTypes for the LeftSidebar
LeftSidebar.propTypes = {
    selectedTool: PropTypes.string,
    onToolSelect: PropTypes.func.isRequired,
};