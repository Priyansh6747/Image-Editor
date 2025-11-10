import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { motion } from 'framer-motion';

export default function RightPanel({
                                       selectedTool,
                                       properties,
                                       onPropertyChange,
                                       onApply,
                                       onReset
                                   }) {
    const [selectedFilter, setSelectedFilter] = useState(properties.filter);

    useEffect(() => {
        setSelectedFilter(properties.filter);
    }, [properties.filter]);

    const handleApply = () => {
        onPropertyChange('filter', selectedFilter);
        onApply();
    };

    const renderToolProperties = () => {
        switch (selectedTool) {
            case 'crop':
                return (
                    <motion.div
                        key="crop"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 style={{ color: 'var(--editor-text)' }}>Crop Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="mb-2 block" style={{ color: 'var(--editor-text-muted)' }}>Aspect Ratio</Label>
                                <RadioGroup
                                    value={properties.aspectRatio || 'free'}
                                    onValueChange={(value) => onPropertyChange('aspectRatio', value)}
                                    className="space-y-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="free" id="free" />
                                        <Label htmlFor="free" className="cursor-pointer" style={{ color: 'var(--editor-text)' }}>Free</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="1:1" id="1:1" />
                                        <Label htmlFor="1:1" className="cursor-pointer" style={{ color: 'var(--editor-text)' }}>1:1 Square</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="16:9" id="16:9" />
                                        <Label htmlFor="16:9" className="cursor-pointer" style={{ color: 'var(--editor-text)' }}>16:9 Landscape</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="4:3" id="4:3" />
                                        <Label htmlFor="4:3" className="cursor-pointer" style={{ color: 'var(--editor-text)' }}>4:3 Standard</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'filters':
                return (
                    <motion.div
                        key="filters"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 style={{ color: 'var(--editor-text)' }}>Filters</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {['None', 'Grayscale', 'Sepia', 'Vintage', 'Neon', 'Cool'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setSelectedFilter(filter.toLowerCase())}
                                        className={`px-4 py-2 rounded-lg transition-all ${
                                            selectedFilter === filter.toLowerCase()
                                                ? 'neon-glow text-white'
                                                : ''
                                        }`}
                                        style={{
                                            backgroundColor: selectedFilter === filter.toLowerCase()
                                                ? 'var(--editor-neon-blue)'
                                                : 'rgba(31, 111, 235, 0.1)',
                                            color: selectedFilter === filter.toLowerCase()
                                                ? '#ffffff'
                                                : 'var(--editor-text)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedFilter !== filter.toLowerCase()) {
                                                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedFilter !== filter.toLowerCase()) {
                                                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.1)';
                                            }
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );

            case 'adjustments':
                return (
                    <motion.div
                        key="adjustments"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 style={{ color: 'var(--editor-text)' }}>Adjustments</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label style={{ color: 'var(--editor-text-muted)' }}>Brightness</Label>
                                    <span style={{ color: 'var(--editor-text)' }}>{properties.brightness || 0}</span>
                                </div>
                                <Slider
                                    value={[properties.brightness || 0]}
                                    onValueChange={(value) => onPropertyChange('brightness', value[0])}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    className="[&_[role=slider]]:border-2"
                                    style={{
                                        '--slider-thumb-bg': 'var(--editor-neon-blue)',
                                        '--slider-thumb-border': 'var(--editor-neon-cyan)'
                                    }}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label style={{ color: 'var(--editor-text-muted)' }}>Contrast</Label>
                                    <span style={{ color: 'var(--editor-text)' }}>{properties.contrast || 0}</span>
                                </div>
                                <Slider
                                    value={[properties.contrast || 0]}
                                    onValueChange={(value) => onPropertyChange('contrast', value[0])}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    className="[&_[role=slider]]:border-2"
                                    style={{
                                        '--slider-thumb-bg': 'var(--editor-neon-blue)',
                                        '--slider-thumb-border': 'var(--editor-neon-cyan)'
                                    }}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label style={{ color: 'var(--editor-text-muted)' }}>Saturation</Label>
                                    <span style={{ color: 'var(--editor-text)' }}>{properties.saturation || 0}</span>
                                </div>
                                <Slider
                                    value={[properties.saturation || 0]}
                                    onValueChange={(value) => onPropertyChange('saturation', value[0])}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    className="[&_[role=slider]]:border-2"
                                    style={{
                                        '--slider-thumb-bg': 'var(--editor-neon-blue)',
                                        '--slider-thumb-border': 'var(--editor-neon-cyan)'
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );

            case 'text':
                return (
                    <motion.div
                        key="text"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 style={{ color: 'var(--editor-text)' }}>Add Text</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="mb-2 block" style={{ color: 'var(--editor-text-muted)' }}>Text Content</Label>
                                <Input
                                    value={properties.textContent || ''}
                                    onChange={(e) => onPropertyChange('textContent', e.target.value)}
                                    placeholder="Enter text..."
                                    style={{
                                        backgroundColor: 'rgba(31, 111, 235, 0.1)',
                                        borderColor: 'rgba(31, 111, 235, 0.3)',
                                        color: 'var(--editor-text)'
                                    }}
                                    className="placeholder:text-[var(--editor-text-muted)]"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label style={{ color: 'var(--editor-text-muted)' }}>Font Size</Label>
                                    <span style={{ color: 'var(--editor-text)' }}>{properties.fontSize || 24}px</span>
                                </div>
                                <Slider
                                    value={[properties.fontSize || 24]}
                                    onValueChange={(value) => onPropertyChange('fontSize', value[0])}
                                    min={12}
                                    max={72}
                                    step={1}
                                    className="[&_[role=slider]]:border-2"
                                    style={{
                                        '--slider-thumb-bg': 'var(--editor-neon-blue)',
                                        '--slider-thumb-border': 'var(--editor-neon-cyan)'
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );

            case 'steganography':
                return (
                    <motion.div
                        key="steganography"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 style={{ color: 'var(--editor-text)' }}>Steganography</h3>
                        <p style={{ color: 'var(--editor-text-muted)' }}>
                            Hide secret messages or images within your image using steganography techniques.
                        </p>
                        <div className="space-y-2" style={{ color: 'var(--editor-text-muted)' }}>
                            <p>• Hide text messages</p>
                            <p>• Hide images within images</p>
                            <p>• Extract hidden data</p>
                        </div>
                    </motion.div>
                );

            default:
                return (
                    <div className="space-y-6">
                        <h3 style={{ color: 'var(--editor-text)' }}>Select a Tool</h3>
                        <p style={{ color: 'var(--editor-text-muted)' }}>Choose a tool from the sidebar to see its properties here.</p>
                    </div>
                );
        }
    };

    return (
        <div className="w-80 glass-panel border-l flex flex-col" style={{ borderColor: 'var(--editor-border)' }}>
            <div className="flex-1 p-6 overflow-y-auto">
                {renderToolProperties()}
            </div>

            {selectedTool && selectedTool !== 'steganography' && selectedTool !== 'adjustments' && (
                <div className="p-6 border-t space-y-3" style={{ borderColor: 'var(--editor-border)' }}>
                    <Button
                        onClick={selectedTool === 'filters' ? handleApply : onApply}
                        className="w-full text-white neon-glow"
                        style={{ backgroundColor: 'var(--editor-neon-blue)' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        Apply Changes
                    </Button>
                    <Button
                        onClick={onReset}
                        variant="outline"
                        className="w-full"
                        style={{
                            borderColor: 'rgba(31, 111, 235, 0.5)',
                            color: 'var(--editor-text)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        Reset
                    </Button>
                </div>
            )}
        </div>
    );
}