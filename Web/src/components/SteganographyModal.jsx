import { useState } from 'react';
import { Upload, Lock, Unlock, Download, Image as ImageIcon, FileText, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function SteganographyModal({ open, onOpenChange }) {
    const [activeTab, setActiveTab] = useState('hide-text');
    const [secretText, setSecretText] = useState('');
    const [carrierFile, setCarrierFile] = useState(null);
    const [secretFile, setSecretFile] = useState(null);
    const [encodedFile, setEncodedFile] = useState(null);
    const [extractedData, setExtractedData] = useState('');
    const [extractedImageUrl, setExtractedImageUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [capacityInfo, setCapacityInfo] = useState(null);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Enhanced LSB Steganography with better image handling
    const encodeLSB = (canvas, data) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        const totalChannels = 3; // use RGB only
        const maxBytes = Math.floor((pixels.length / 4) * totalChannels) - 8;

        if (data.length > maxBytes) {
            throw new Error(`Data too large. Max ${(maxBytes/1024).toFixed(2)} KB, got ${(data.length/1024).toFixed(2)} KB`);
        }

        // 64-bit length header
        const lengthBits = data.length.toString(2).padStart(64, '0');

        let allBits = lengthBits;
        for (let i = 0; i < data.length; i++) {
            allBits += data[i].toString(2).padStart(8, '0');
        }

        let bitPos = 0;
        for (let i = 0; i < allBits.length; i++) {
            const pixelIdx = Math.floor(bitPos / totalChannels) * 4;
            const channel = bitPos % totalChannels; // 0=R,1=G,2=B
            const bit = parseInt(allBits[i]);
            pixels[pixelIdx + channel] = (pixels[pixelIdx + channel] & 0xFE) | bit;
            bitPos++;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    };

    const decodeLSB = (canvas) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const totalChannels = 3;

        // Read first 64 bits (data length)
        let bitPos = 0;
        let lengthBits = '';

        for (let i = 0; i < 64; i++) {
            const pixelIdx = Math.floor(bitPos / totalChannels) * 4;
            const channel = bitPos % totalChannels;
            lengthBits += (pixels[pixelIdx + channel] & 1).toString();
            bitPos++;
        }

        const dataLength = parseInt(lengthBits, 2);
        const maxData = Math.floor((pixels.length / 4) * totalChannels / 8);
        if (isNaN(dataLength) || dataLength <= 0 || dataLength > maxData) {
            throw new Error('No valid hidden data found');
        }

        // Read data bytes
        const data = new Uint8Array(dataLength);
        for (let i = 0; i < dataLength; i++) {
            let byteBits = '';
            for (let j = 0; j < 8; j++) {
                const pixelIdx = Math.floor(bitPos / totalChannels) * 4;
                const channel = bitPos % totalChannels;
                byteBits += (pixels[pixelIdx + channel] & 1).toString();
                bitPos++;
            }
            data[i] = parseInt(byteBits, 2);
        }

        return data;
    };

    const loadImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve({ canvas, width: img.width, height: img.height });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    };

    const handleFileSelect = (e, setter) => {
        const file = e.target.files[0];
        if (file) {
            setter(file);
            setMessage({ type: '', text: '' });
            setExtractedData('');
            setExtractedImageUrl('');
        }
    };

    const checkCapacity = async () => {
        if (!carrierFile || !secretFile) {
            showMessage('error', 'Please upload both carrier and secret images');
            return;
        }

        setIsProcessing(true);
        try {
            const carrier = await loadImage(carrierFile);
            const secret = await loadImage(secretFile);

            const secretBlob = await new Promise(resolve =>
                secret.canvas.toBlob(resolve, 'image/png')
            );
            const secretSize = secretBlob.size;

            const carrierCapacity = Math.floor((carrier.canvas.width * carrier.canvas.height * 3) / 8) - 8;
            const canEncode = secretSize <= carrierCapacity;
            const usagePercent = (secretSize / carrierCapacity * 100).toFixed(2);

            setCapacityInfo({
                can_encode: canEncode,
                carrier_info: {
                    dimensions: `${carrier.width}x${carrier.height}`,
                    capacity_mb: (carrierCapacity / (1024 * 1024)).toFixed(2)
                },
                secret_info: {
                    dimensions: `${secret.width}x${secret.height}`,
                    size_kb: (secretSize / 1024).toFixed(2)
                },
                analysis: {
                    usage_percent: usagePercent,
                    recommendation: canEncode
                        ? 'Encoding possible!'
                        : `Carrier too small. Need ${(secretSize - carrierCapacity)/1024} KB more capacity`
                }
            });

            if (canEncode) {
                showMessage('success', `Encoding possible! ${usagePercent}% capacity used`);
            } else {
                showMessage('error', `Carrier too small. Need ${((secretSize - carrierCapacity)/1024).toFixed(2)} KB more capacity`);
            }
        } catch (error) {
            showMessage('error', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const encodeText = async () => {
        if (!carrierFile) {
            showMessage('error', 'Please upload a carrier image');
            return;
        }
        if (!secretText.trim()) {
            showMessage('error', 'Please enter text to hide');
            return;
        }

        setIsProcessing(true);
        try {
            const { canvas } = await loadImage(carrierFile);
            const textBytes = new TextEncoder().encode(secretText);

            encodeLSB(canvas, textBytes);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `encoded_${carrierFile.name.split('.')[0]}.png`;
                a.click();
                URL.revokeObjectURL(url);
                showMessage('success', 'Text encoded successfully! Download started.');
                setIsProcessing(false);
            }, 'image/png', 1.0);

        } catch (error) {
            showMessage('error', error.message);
            setIsProcessing(false);
        }
    };

    const encodeImage = async () => {
        if (!carrierFile || !secretFile) {
            showMessage('error', 'Please upload both carrier and secret images');
            return;
        }

        setIsProcessing(true);
        try {
            const carrier = await loadImage(carrierFile);
            const secret = await loadImage(secretFile);

            const secretBlob = await new Promise(resolve =>
                secret.canvas.toBlob(resolve, 'image/png')
            );
            const secretBytes = new Uint8Array(await secretBlob.arrayBuffer());

            encodeLSB(carrier.canvas, secretBytes);

            carrier.canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `steg_${carrierFile.name.split('.')[0]}.png`;
                a.click();
                URL.revokeObjectURL(url);
                showMessage('success', 'Image encoded successfully! Download started.');
                setIsProcessing(false);
            }, 'image/png', 1.0);

        } catch (error) {
            showMessage('error', error.message);
            setIsProcessing(false);
        }
    };

    const decodeImage = async () => {
        if (!encodedFile) {
            showMessage('error', 'Please upload an encoded image');
            return;
        }

        setIsProcessing(true);
        try {
            const { canvas } = await loadImage(encodedFile);
            const hiddenData = decodeLSB(canvas);

            // Try as text first
            try {
                const text = new TextDecoder('utf-8', { fatal: true }).decode(hiddenData);
                const isPrintable = text.split('').every(char => {
                    const code = char.charCodeAt(0);
                    return (code >= 32 && code < 127) || code === 9 || code === 10 || code === 13;
                });

                if (isPrintable && text.length < 10000) {
                    setExtractedData(text);
                    showMessage('success', 'Text extracted successfully!');
                    setIsProcessing(false);
                    return;
                }
            } catch (e) {
                // Not valid UTF-8 text
            }

            // Try as image
            const blob = new Blob([hiddenData], { type: 'image/png' });
            const url = URL.createObjectURL(blob);

            const testImg = new window.Image();
            testImg.onload = () => {
                setExtractedImageUrl(url);
                setExtractedData('');
                showMessage('success', 'Image extracted successfully!');
                setIsProcessing(false);
            };

            testImg.onerror = () => {
                URL.revokeObjectURL(url);
                // Not an image, offer download as binary
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'extracted_data.bin';
                a.click();
                URL.revokeObjectURL(downloadUrl);
                setExtractedData('Binary data extracted and downloaded!');
                showMessage('success', 'Data extracted! Download started.');
                setIsProcessing(false);
            };

            testImg.src = url;
        } catch (error) {
            showMessage('error', error.message);
            setIsProcessing(false);
        }
    };

    const downloadExtractedImage = () => {
        if (extractedImageUrl) {
            const a = document.createElement('a');
            a.href = extractedImageUrl;
            a.download = 'extracted_image.png';
            a.click();
        }
    };

    const neonButtonStyles = {
        background: 'linear-gradient(to right, var(--editor-neon-blue), var(--editor-neon-cyan))',
        color: 'var(--editor-text)',
        transition: 'all 0.2s ease',
    };

    const handleMouseInteraction = (event, type) => {
        if (isProcessing) return;
        if (type === 'enter') {
            event.currentTarget.style.opacity = '0.9';
        } else if (type === 'leave') {
            event.currentTarget.style.opacity = '1';
            event.currentTarget.style.transform = 'scale(1)';
            event.currentTarget.style.filter = 'brightness(1)';
        } else if (type === 'down') {
            event.currentTarget.style.transform = 'scale(0.97)';
            event.currentTarget.style.filter = 'brightness(1.15)';
        } else if (type === 'up') {
            event.currentTarget.style.transform = 'scale(1)';
            event.currentTarget.style.filter = 'brightness(1)';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-panel max-w-2xl border border-[rgba(31,111,235,0.2)] bg-editor-panel text-editor-text">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-editor-text">
                        <Lock className="w-5 h-5 text-editor-neon-cyan" />
                        Steganography Tools
                    </DialogTitle>
                    <DialogDescription className="text-editor-text-muted">
                        Hide or extract secret data from images using steganography
                    </DialogDescription>
                </DialogHeader>

                {/* Message Alert */}
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success'
                                ? 'bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]'
                                : 'bg-[rgba(239,68,68,0.1)] text-red-400 border border-[rgba(239,68,68,0.3)]'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{message.text}</span>
                    </motion.div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-[rgba(31,111,235,0.1)]">
                        <TabsTrigger
                            value="hide-text"
                            className="text-[var(--editor-text-muted)] data-[state=active]:bg-editor-neon-blue data-[state=active]:text-[var(--editor-text)]"
                        >
                            <FileText className="w-4 h-4 inline mr-2" />
                            Hide Text
                        </TabsTrigger>
                        <TabsTrigger
                            value="hide-image"
                            className="text-[var(--editor-text-muted)] data-[state=active]:bg-editor-neon-blue data-[state=active]:text-[var(--editor-text)]"
                        >
                            <ImageIcon className="w-4 h-4 inline mr-2" />
                            Hide Image
                        </TabsTrigger>
                        <TabsTrigger
                            value="extract"
                            className="text-[var(--editor-text-muted)] data-[state=active]:bg-editor-neon-blue data-[state=active]:text-[var(--editor-text)]"
                        >
                            <Unlock className="w-4 h-4 inline mr-2" />
                            Extract Data
                        </TabsTrigger>
                    </TabsList>

                    {/* Hide Text Tab */}
                    <TabsContent value="hide-text" className="space-y-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div>
                                <Label className="block text-editor-text-muted mb-2">
                                    Carrier Image (will contain the hidden text)
                                </Label>
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-[rgba(31,111,235,0.3)] rounded-lg p-6 text-center hover:border-editor-neon-cyan transition-colors">
                                        <Upload className="w-8 h-8 text-editor-neon-blue mx-auto mb-2" />
                                        <p className="text-editor-text">{carrierFile ? carrierFile.name : 'Click to upload carrier image'}</p>
                                        <p className="text-editor-text-muted text-sm mt-1">PNG, JPG, or BMP</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, setCarrierFile)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div>
                                <Label className="block text-editor-text-muted mb-2">Secret Message</Label>
                                <Textarea
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter your secret message here..."
                                    className="min-h-32 bg-[rgba(31,111,235,0.1)] border border-[rgba(31,111,235,0.3)] text-editor-text placeholder:text-editor-text-muted"
                                />
                            </div>

                            <Button
                                onClick={encodeText}
                                disabled={isProcessing}
                                className="w-full neon-glow-cyan gap-2"
                                style={neonButtonStyles}
                                onMouseEnter={(e) => handleMouseInteraction(e, 'enter')}
                                onMouseLeave={(e) => handleMouseInteraction(e, 'leave')}
                                onMouseDown={(e) => handleMouseInteraction(e, 'down')}
                                onMouseUp={(e) => handleMouseInteraction(e, 'up')}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Encoding...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Encode & Download
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </TabsContent>

                    {/* Hide Image Tab */}
                    <TabsContent value="hide-image" className="space-y-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div>
                                <Label className="block text-editor-text-muted mb-2">
                                    Carrier Image (will contain the hidden image)
                                </Label>
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-[rgba(31,111,235,0.3)] rounded-lg p-6 text-center hover:border-editor-neon-cyan transition-colors">
                                        <Upload className="w-8 h-8 text-editor-neon-blue mx-auto mb-2" />
                                        <p className="text-editor-text">{carrierFile ? carrierFile.name : 'Click to upload carrier image'}</p>
                                        <p className="text-editor-text-muted text-sm mt-1">Larger image recommended</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, setCarrierFile)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div>
                                <Label className="block text-editor-text-muted mb-2">
                                    Secret Image (to hide)
                                </Label>
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-[rgba(31,111,235,0.3)] rounded-lg p-6 text-center hover:border-editor-neon-cyan transition-colors">
                                        <ImageIcon className="w-8 h-8 text-editor-neon-blue mx-auto mb-2" />
                                        <p className="text-editor-text">{secretFile ? secretFile.name : 'Click to upload secret image'}</p>
                                        <p className="text-editor-text-muted text-sm mt-1">Image to hide inside carrier</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, setSecretFile)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {capacityInfo && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-4 rounded-lg border ${
                                        capacityInfo.can_encode
                                            ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)]'
                                            : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)]'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <Info className="w-5 h-5 text-editor-neon-cyan mt-0.5" />
                                        <div className="text-sm text-editor-text">
                                            <p className="font-medium mb-1">Capacity Analysis:</p>
                                            <p>Carrier: {capacityInfo.carrier_info.dimensions} ({capacityInfo.carrier_info.capacity_mb} MB capacity)</p>
                                            <p>Secret: {capacityInfo.secret_info.dimensions} ({capacityInfo.secret_info.size_kb} KB)</p>
                                            <p className="mt-1 font-medium">{capacityInfo.analysis.recommendation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={checkCapacity}
                                    disabled={isProcessing}
                                    className="flex-1 bg-[rgba(31,111,235,0.2)] hover:bg-[rgba(31,111,235,0.3)] text-editor-text gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Info className="w-5 h-5" />}
                                    Check Capacity
                                </Button>
                                <Button
                                    onClick={encodeImage}
                                    disabled={isProcessing}
                                    className="flex-1 neon-glow-cyan gap-2"
                                    style={neonButtonStyles}
                                    onMouseEnter={(e) => handleMouseInteraction(e, 'enter')}
                                    onMouseLeave={(e) => handleMouseInteraction(e, 'leave')}
                                    onMouseDown={(e) => handleMouseInteraction(e, 'down')}
                                    onMouseUp={(e) => handleMouseInteraction(e, 'up')}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Encoding...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Encode & Download
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </TabsContent>

                    {/* Extract Tab */}
                    <TabsContent value="extract" className="space-y-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div>
                                <Label className="block text-editor-text-muted mb-2">Encoded Image</Label>
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-[rgba(31,111,235,0.3)] rounded-lg p-6 text-center hover:border-editor-neon-cyan transition-colors">
                                        <Upload className="w-8 h-8 text-editor-neon-blue mx-auto mb-2" />
                                        <p className="text-editor-text">{encodedFile ? encodedFile.name : 'Click to upload encoded image'}</p>
                                        <p className="text-editor-text-muted text-sm mt-1">Image containing hidden data</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, setEncodedFile)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <Button
                                onClick={decodeImage}
                                disabled={isProcessing}
                                className="w-full neon-glow-cyan gap-2"
                                style={neonButtonStyles}
                                onMouseEnter={(e) => handleMouseInteraction(e, 'enter')}
                                onMouseLeave={(e) => handleMouseInteraction(e, 'leave')}
                                onMouseDown={(e) => handleMouseInteraction(e, 'down')}
                                onMouseUp={(e) => handleMouseInteraction(e, 'up')}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Decoding...
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-5 h-5" />
                                        Decode & Extract
                                    </>
                                )}
                            </Button>

                            {extractedData && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)]"
                                >
                                    <Label className="block text-green-400 mb-2">Extracted Data:</Label>
                                    <div className="bg-[rgba(0,0,0,0.3)] rounded p-3 text-editor-text whitespace-pre-wrap break-words">
                                        {extractedData}
                                    </div>
                                </motion.div>
                            )}

                            {extractedImageUrl && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)]"
                                >
                                    <Label className="block text-green-400 mb-3">Extracted Image:</Label>
                                    <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 mb-3">
                                        <img
                                            src={extractedImageUrl}
                                            alt="Extracted"
                                            className="max-w-full h-auto mx-auto rounded-lg"
                                            style={{ maxHeight: '400px' }}
                                        />
                                    </div>
                                    <Button
                                        onClick={downloadExtractedImage}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Extracted Image
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="text-center mt-4 text-editor-text-muted text-sm">
                    <p>Steganography powered by LSB (Least Significant Bit) encoding</p>
                    <p className="mt-1">Always use PNG format for encoded images to preserve hidden data</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SteganographyModal;