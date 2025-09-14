import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Download, Save, Settings, AlertCircle, Camera, Palette, Zap, Heart, Star, Layers, Brush, Image as ImageIcon, TrendingUp, Wand2 as Magic2, Shuffle, Eye, Share2, Grid3X3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fashionService } from '../../services/fashionService';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import { ThemeToggleDropdown } from '../../components/ui/ThemeToggle';
import { cn } from '../../utils/cn';

const AIFashionGenerationStudio = () => {
  const { user, userProfile, hasCredits, refreshUserData } = useAuth();
  
  // Main state
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [inspirationImage, setInspirationImage] = useState(null);
  const [inspirationImagePreview, setInspirationImagePreview] = useState(null);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [creativityLevel, setCreativityLevel] = useState(0.7);
  const [conversationalPrompt, setConversationalPrompt] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [showStylesGrid, setShowStylesGrid] = useState(false);

  // Initialize available styles
  useEffect(() => {
    setAvailableStyles(fashionService?.getAvailableStyles());
  }, []);

  // Check storage status
  useEffect(() => {
    const checkStorageStatus = async () => {
      if (user?.id) {
        try {
          const storageStats = await fashionService?.getUserStorageStats(user?.id);
          if (storageStats?.isNearLimit) {
            setStorageWarning(storageStats);
          }
        } catch (error) {
          console.error('Storage check error:', error);
        }
      }
    };

    checkStorageStatus();
  }, [user?.id]);

  // Handle main image upload
  const handleMainImageUpload = useCallback((event) => {
    const file = event?.target?.files?.[0];
    if (file) {
      if (file?.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }

      setMainImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setMainImagePreview(e?.target?.result);
      reader?.readAsDataURL(file);
    }
  }, []);

  // Handle inspiration image upload
  const handleInspirationImageUpload = useCallback(async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (file?.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check if user has credits for inspiration photos (optional feature)
    if (!hasCredits(1)) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setLoading(true);
      
      // Upload to storage
      const uploadResult = await fashionService?.uploadInspirationImage(file, user?.id);
      
      setInspirationImage(uploadResult);
      const reader = new FileReader();
      reader.onload = (e) => setInspirationImagePreview(e?.target?.result);
      reader?.readAsDataURL(file);
      
    } catch (error) {
      console.error('Inspiration upload error:', error);
      if (error?.message?.includes('Storage limit exceeded')) {
        setStorageWarning({ needsUpgrade: true });
      } else {
        alert(error?.message || 'Failed to upload inspiration image');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, userProfile]);

  // Handle style selection (max 10)
  const handleStyleToggle = useCallback((styleId) => {
    setSelectedStyles(prev => {
      const isSelected = prev?.includes(styleId);
      if (isSelected) {
        return prev?.filter(id => id !== styleId);
      } else if (prev?.length < 10) {
        return [...prev, styleId];
      } else {
        alert('Maximum 10 styles can be selected');
        return prev;
      }
    });
  }, []);

  // Generate fashion overlay
  const handleGenerate = useCallback(async () => {
    if (!mainImage) {
      alert('Please upload a photo first');
      return;
    }

    if (selectedStyles?.length === 0) {
      alert('Please select at least one style');
      return;
    }

    if (!hasCredits(1)) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedResults([]);
      
      // Convert image to base64
      const imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.readAsDataURL(mainImage);
      });

      const options = {
        styles: selectedStyles,
        creativityLevel,
        maxImages: 1,
        inspirationImage: inspirationImage?.url,
        conversationalPrompt: inspirationImage ? conversationalPrompt : ''
      };

      const result = await fashionService?.generateFashionAnalysis(imageDataUrl, options);
      
      if (result?.images && result?.images?.length > 0) {
        setGeneratedResults(result?.images);
        setCurrentResultIndex(0);
        
        // Refresh user data to update credits
        await refreshUserData();
      } else {
        throw new Error('No results generated');
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to generate fashion overlay';
      
      if (error?.message?.includes('credits')) {
        errorMessage = 'You have no credits left! Please upgrade your plan or purchase more credits to continue generating AI fashion content.';
        setShowUpgradeModal(true);
      } else if (error?.message?.includes('API')) {
        errorMessage = 'AI service temporarily unavailable. Please try again in a few moments.';
      } else if (error?.message?.includes('image')) {
        errorMessage = 'There was an issue processing your image. Please try uploading a different photo.';
      } else {
        errorMessage = error?.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [mainImage, selectedStyles, creativityLevel, inspirationImage, conversationalPrompt, hasCredits, refreshUserData]);

  // Save result to portfolio
  const handleSaveToPortfolio = useCallback(async (imageData) => {
    try {
      setLoading(true);
      
      const metadata = {
        style: selectedStyles?.join(', '),
        creativityLevel,
        originalPrompt: conversationalPrompt,
        hasInspirationImage: !!inspirationImage
      };

      await fashionService?.saveToPortfolio(imageData, metadata);
      alert('Saved to portfolio successfully!');
      
    } catch (error) {
      console.error('Save error:', error);
      alert(error?.message || 'Failed to save to portfolio');
    } finally {
      setLoading(false);
    }
  }, [selectedStyles, creativityLevel, conversationalPrompt, inspirationImage]);

  // Download image
  const handleDownload = useCallback((imageData, index = 0) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `fashiongen-result-${Date.now()}-${index + 1}.png`;
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
  }, []);

  const currentResult = generatedResults?.[currentResultIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface/50 to-primary/5 dark:from-background dark:via-surface/30 dark:to-primary/10 relative overflow-x-hidden">
      {/* Enhanced Background decoration with animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-fashion-light rounded-full blur-3xl opacity-30 float" />
        <div className="absolute -bottom-32 -left-40 w-96 h-96 gradient-flow rounded-full blur-3xl opacity-20 float-delayed morph" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-fashion-blue/5 to-fashion-pink/5 rounded-full blur-3xl opacity-20 pulse-glow" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-fashion-purple/10 rounded-full blur-2xl opacity-40 float" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-fashion-pink/10 rounded-full blur-2xl opacity-30 float-delayed" />
      </div>
      {/* Enhanced Header with Theme Toggle */}
      <div className="relative z-10">
        <div className="flex items-center justify-between p-4 glass backdrop-blur-xl border-b border-border/20">
          <PageHeader 
            title="AI Virtual Wardrobe Studio"
            description="Create stunning fashion looks with AI-powered style generation"
            icon={Magic2}
            className="border-none bg-transparent shadow-none"
            gradient={true}
            glowEffect={true}
            actions={<></>}
          />
          <div className="flex items-center space-x-3">
            <ThemeToggleDropdown />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Credits Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass-strong rounded-2xl p-6 border border-border/30 shadow-primary/10 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-fashion rounded-2xl flex items-center justify-center shadow-glow">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-gradient-fashion">API Credits</h3>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold mt-1">
                  {userProfile?.current_api_credits || 0}
                  <span className="text-lg text-muted-foreground ml-2 font-normal">remaining</span>
                </p>
                {(userProfile?.current_api_credits || 0) === 0 && (
                  <div className="flex items-center space-x-2 mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      No credits left - upgrade to continue
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Plan: <span className="font-medium text-primary">
                    {userProfile?.user_subscriptions?.[0]?.subscription_plans?.name || 'Free'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="text-right space-y-2">
                                <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-gradient-fashion hover:shadow-glow btn-hover-lift px-6 hover-glow gradient-shimmer"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
              <p className="text-xs text-muted-foreground">Get more credits & features</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Enhanced Input Panel */}
          <div className="xl:col-span-4 space-y-6">
            {/* Main Image Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 border border-border/30 card-hover"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center text-gradient">
                <Camera className="w-6 h-6 mr-3 text-primary" />
                Upload Your Photo
              </h3>
              
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                  id="main-image-upload"
                />
                <label
                  htmlFor="main-image-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
                    "group-hover:scale-[1.02] group-hover:shadow-primary/20 group-hover:shadow-lg",
                    mainImagePreview 
                      ? "border-primary/50 bg-primary/5 shadow-primary/10 shadow-lg" 
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {mainImagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                        <div className="text-white text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to change</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-8">
                      <div className="w-16 h-16 bg-gradient-fashion rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-lg font-medium text-center mb-2">
                        Drop your photo here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground text-center">
                        Support JPG, PNG, WebP • Max 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </motion.div>

            {/* Enhanced Style Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 border border-border/30 card-hover"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center text-gradient">
                  <Palette className="w-6 h-6 mr-3 text-primary" />
                  Style Selection
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {selectedStyles?.length}/10
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStylesGrid(!showStylesGrid)}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className={cn(
                "grid gap-3 transition-all duration-300",
                showStylesGrid ? "grid-cols-1" : "grid-cols-2",
                "max-h-80 overflow-y-auto scrollbar-hide"
              )}>
                {availableStyles?.map((style, index) => (
                  <motion.button
                    key={style?.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => handleStyleToggle(style?.id)}
                    className={cn(
                      "group relative p-4 rounded-xl text-left transition-all duration-300 border card-hover",
                      selectedStyles?.includes(style?.id)
                        ? "border-primary bg-primary/10 shadow-primary/20 shadow-lg scale-105" 
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {/* Style content */}
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                        selectedStyles?.includes(style?.id)
                          ? "bg-gradient-fashion scale-110" :"bg-muted group-hover:bg-primary/20"
                      )}>
                        <Brush className={cn(
                          "w-5 h-5 transition-colors",
                          selectedStyles?.includes(style?.id) ? "text-white" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">{style?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {style?.description}
                        </p>
                      </div>
                      {selectedStyles?.includes(style?.id) && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    
                    {/* Selection animation */}
                    <AnimatePresence>
                      {selectedStyles?.includes(style?.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Enhanced Creativity Level */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 border border-border/30 card-hover"
            >
              <h3 className="text-xl font-bold mb-6 text-gradient">Creativity Level</h3>
              <div className="space-y-6">
                <div className="relative">
                  <div className="flex justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Conservative
                    </span>
                    <span className="flex items-center">
                      <Magic2 className="w-4 h-4 mr-1" />
                      Creative
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={creativityLevel}
                    onChange={(e) => setCreativityLevel(parseFloat(e?.target?.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                  {/* Custom track styling */}
                  <div 
                    className="absolute top-[18px] left-0 h-3 bg-gradient-fashion rounded-lg pointer-events-none"
                    style={{ width: `${creativityLevel * 100}%` }}
                  />
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary">
                      {Math.round(creativityLevel * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {creativityLevel < 0.3 && "Subtle & refined changes"}
                    {creativityLevel >= 0.3 && creativityLevel < 0.7 && "Balanced creativity"}
                    {creativityLevel >= 0.7 && "Bold & imaginative results"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Inspiration Image (Pro/Premium only) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6 border border-border/30 card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center text-gradient">
                  <Sparkles className="w-6 h-6 mr-3 text-primary" />
                  Inspiration Photo
                </h3>
                {userProfile?.user_subscriptions?.[0]?.subscription_plans?.name === 'Basic' && (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs rounded-full font-medium shadow-lg">
                    Pro+
                  </span>
                )}
              </div>
              
              {userProfile?.user_subscriptions?.[0]?.subscription_plans?.name !== 'Basic' ? (
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInspirationImageUpload}
                    className="hidden"
                    id="inspiration-image-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="inspiration-image-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group",
                      "hover:scale-[1.02] hover:shadow-lg",
                      inspirationImagePreview 
                        ? "border-primary/50 bg-primary/5" :"border-border hover:border-primary/50 hover:bg-primary/5",
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    {inspirationImagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={inspirationImagePreview}
                          alt="Inspiration"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <p className="text-white font-medium">Change inspiration</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-4">
                        <div className="w-12 h-12 bg-gradient-fashion rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-center">
                          Add inspiration image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional reference photo
                        </p>
                      </div>
                    )}
                  </label>
                  
                  {inspirationImagePreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <textarea
                        value={conversationalPrompt}
                        onChange={(e) => setConversationalPrompt(e?.target?.value)}
                        placeholder="Describe what you love about this style... (e.g., 'I love the flowing silhouette and vibrant colors')"
                        className="w-full p-4 border border-border rounded-xl bg-background/50 text-sm min-h-[100px] focus-ring resize-none"
                        rows={4}
                      />
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Upgrade to Pro or Premium to use inspiration photos and unlock advanced features
                  </p>
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-gradient-fashion hover:shadow-glow btn-hover-lift"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Enhanced Results Panel */}
          <div className="xl:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card rounded-2xl p-8 border border-border/30 h-full min-h-[800px] card-hover"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gradient">AI Generation Results</h3>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setSelectedStyles([])}
                    variant="outline"
                    size="sm"
                    disabled={selectedStyles?.length === 0}
                    className="border-border/50 hover:border-primary/30"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!mainImage || selectedStyles?.length === 0 || isGenerating || !hasCredits(1)}
                    className={cn(
                      "relative overflow-hidden bg-gradient-fashion hover:shadow-glow btn-hover-lift px-6 py-3 hover-glow text-shimmer",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      !isGenerating && "gradient-shimmer"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Magic2 className="w-5 h-5 mr-2" />
                        Generate Style
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Generation Progress */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-96 space-y-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-4 w-12 h-12 bg-gradient-fashion rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gradient mb-2">
                      Creating Your Fashion Masterpiece...
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Our AI is analyzing your photo and selected styles
                    </p>
                    <div className="w-80 bg-muted/30 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-fashion h-full rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Layers className="w-4 h-4 mr-1 text-primary" />
                      Analyzing image
                    </div>
                    <div className="flex items-center">
                      <Palette className="w-4 h-4 mr-1 text-primary" />
                      Applying styles
                    </div>
                    <div className="flex items-center">
                      <Magic2 className="w-4 h-4 mr-1 text-primary" />
                      Generating result
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Results Display */}
              {!isGenerating && currentResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="relative bg-gradient-to-br from-muted/20 to-primary/5 rounded-2xl p-2 shadow-inner">
                    <img
                      src={currentResult?.url || currentResult}
                      alt="Generated fashion result"
                      className="w-full h-auto max-h-[500px] object-contain rounded-xl shadow-lg"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                      <span className="text-white text-sm font-medium">✨ AI Generated</span>
                    </div>
                  </div>
                  
                  {/* Enhanced Result Actions */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => handleSaveToPortfolio(currentResult?.url || currentResult)}
                      variant="outline"
                      disabled={loading}
                      className="btn-hover-lift border-border/50 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-lg"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Save to Portfolio
                    </Button>
                    <Button
                      onClick={() => handleDownload(currentResult?.url || currentResult, currentResultIndex)}
                      variant="outline"
                      className="btn-hover-lift border-border/50 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download HD
                    </Button>
                    <Button
                      onClick={() => {/* Add share functionality */}}
                      variant="outline"
                      className="btn-hover-lift border-border/50 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-lg"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Multiple Results Navigation */}
                  {generatedResults?.length > 1 && (
                    <div className="flex justify-center space-x-2">
                      {generatedResults?.map((_, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setCurrentResultIndex(index)}
                          className={cn(
                            "w-3 h-3 rounded-full transition-all duration-200",
                            index === currentResultIndex 
                              ? "bg-primary shadow-primary/50 shadow-lg scale-110" 
                              : "bg-muted hover:bg-primary/50"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Enhanced Empty State */}
              {!isGenerating && generatedResults?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-96 text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-fashion rounded-3xl flex items-center justify-center shadow-glow">
                      <Magic2 className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="w-4 h-4 text-yellow-800" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gradient mb-2">
                      Ready to Create Fashion Magic? ✨
                    </h4>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Upload your photo, select your favorite styles, and let our AI transform your look with stunning fashion overlays
                    </p>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-primary" />
                      <span>Upload Photo</span>
                    </div>
                    <div className="flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-primary" />
                      <span>Pick Styles</span>
                    </div>
                    <div className="flex items-center">
                      <Magic2 className="w-5 h-5 mr-2 text-primary" />
                      <span>Generate</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      {/* Storage Warning Modal */}
      <Modal
        isOpen={!!storageWarning}
        onClose={() => setStorageWarning(null)}
        title="Storage Limit Warning"
        footer={<></>}
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm">
                You're approaching your storage limit. Consider upgrading to a higher tier for more storage space.
              </p>
              {storageWarning && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Used: {storageWarning?.used}MB / {storageWarning?.limit}MB ({storageWarning?.usagePercent}%)
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1"
            >
              Upgrade Plan
            </Button>
            <Button
              onClick={() => setStorageWarning(null)}
              variant="outline"
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Your Plan"
        footer={<></>}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unlock more features and higher limits with a premium plan.
          </p>
          <div className="space-y-3">
            <div className="p-3 border border-border rounded-lg">
              <h4 className="font-medium">Pro Plan - $25/month</h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• 5,000 API requests monthly</li>
                <li>• Inspiration photo uploads</li>
                <li>• Priority support</li>
              </ul>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <h4 className="font-medium">Premium Plan - $50/month</h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• 10,000 API requests monthly</li>
                <li>• Unlimited storage</li>
                <li>• 24/7 priority support</li>
              </ul>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => window.location.href = '/customer-portal'}
              className="flex-1"
            >
              View Plans
            </Button>
            <Button
              onClick={() => setShowUpgradeModal(false)}
              variant="outline"
              className="flex-1"
            >
              Later
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIFashionGenerationStudio;