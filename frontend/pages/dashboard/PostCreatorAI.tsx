import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Copy, Check, Loader2, Sparkles, Settings, X, Save, Eye, EyeOff, Hash, Type, Layers, ChevronRight, ChevronLeft, FileText, ArrowLeft } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const STORAGE_KEY = 'ai_post_creator_config';

interface AIConfig {
  apiKey: string;
  modelName: string;
}

type GenerationType = 'post' | 'slogan' | 'hashtag' | 'variations';

const PostCreatorAI: React.FC = () => {
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [promotion, setPromotion] = useState('');

  // Separate states for each type of generated content
  const [postText, setPostText] = useState('');
  const [sloganText, setSloganText] = useState('');
  const [hashtagText, setHashtagText] = useState('');
  const [variationsText, setVariationsText] = useState('');

  // Separate loading states
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false);
  const [isGeneratingHashtag, setIsGeneratingHashtag] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  // Separate copy states
  const [isCopiedPost, setIsCopiedPost] = useState(false);
  const [isCopiedSlogan, setIsCopiedSlogan] = useState(false);
  const [isCopiedHashtag, setIsCopiedHashtag] = useState(false);
  const [isCopiedVariations, setIsCopiedVariations] = useState(false);

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // API Configuration State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [saveConfig, setSaveConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Available Gemini Models
  const availableModels = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
  ];

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const config: AIConfig = JSON.parse(savedConfig);
        // Migrate old model names to new ones
        let modelNameToUse = config.modelName || 'gemini-2.5-flash';
        const validModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-pro'];

        // Migrate from old model names
        if (modelNameToUse.includes('1.5')) {
          modelNameToUse = modelNameToUse.replace('1.5', '2.5');
        }
        // Ensure it's a valid model
        if (!validModels.includes(modelNameToUse)) {
          modelNameToUse = 'gemini-2.5-flash';
        }

        setApiKey(config.apiKey || '');
        setModelName(modelNameToUse);
        setSaveConfig(true);

        // Update saved config if migrated
        if (modelNameToUse !== config.modelName) {
          const updatedConfig: AIConfig = {
            apiKey: config.apiKey,
            modelName: modelNameToUse
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
        }
      } catch (error) {
        console.error('Failed to load saved config:', error);
      }
    }
  }, []);

  // Load saved config when modal opens
  useEffect(() => {
    if (isConfigOpen) {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        try {
          const config: AIConfig = JSON.parse(savedConfig);
          // Migrate old model names to new ones
          let modelNameToUse = config.modelName || 'gemini-2.5-flash';
          const validModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-pro'];

          // Migrate from old model names
          if (modelNameToUse.includes('1.5')) {
            modelNameToUse = modelNameToUse.replace('1.5', '2.5');
          }
          // Ensure it's a valid model
          if (!validModels.includes(modelNameToUse)) {
            modelNameToUse = 'gemini-2.5-flash';
          }

          setApiKey(config.apiKey || '');
          setModelName(modelNameToUse);
          setSaveConfig(true);
        } catch (error) {
          console.error('Failed to load saved config:', error);
        }
      }
    }
  }, [isConfigOpen]);

  const handleSaveConfig = () => {
    if (!apiKey.trim()) {
      alert('API Key ထည့်သွင်းပါ');
      return;
    }

    if (saveConfig) {
      const config: AIConfig = {
        apiKey: apiKey.trim(),
        modelName: modelName
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      alert('API Configuration သိမ်းဆည်းပြီးပါပြီ');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    setIsConfigOpen(false);
  };

  const generateContent = async (type: GenerationType) => {
    if (!productName.trim()) {
      alert('ကုန်ပစ္စည်းအမည် ထည့်သွင်းပါ');
      return;
    }

    // Require main post to be generated first for other types
    if (type !== 'post' && !postText.trim()) {
      alert('ကျေးဇူးပြု၍ စာသားဖန်တီးပါ button ကို အရင် နှိပ်ပါ');
      return;
    }

    if (!apiKey.trim()) {
      alert('API Key ထည့်သွင်းရန် Settings ကို ဖွင့်ပါ');
      setIsConfigOpen(true);
      return;
    }

    // Set appropriate loading state
    if (type === 'post') {
      setIsGeneratingPost(true);
      setPostText('');
    } else if (type === 'slogan') {
      setIsGeneratingSlogan(true);
      setSloganText('');
    } else if (type === 'hashtag') {
      setIsGeneratingHashtag(true);
      setHashtagText('');
    } else if (type === 'variations') {
      setIsGeneratingVariations(true);
      setVariationsText('');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());

      let prompt = '';

      if (type === 'post') {
        prompt = `မြန်မာဘာသာဖြင့် Facebook အတွက် ဆွဲဆောင်မှုရှိသော ကြော်ငြာစာသား တစ်ခု ဖန်တီးပေးပါ။\n\n`;
        prompt += `ကုန်ပစ္စည်းအမည်: ${productName}\n\n`;

        if (productDescription && productDescription.trim()) {
          prompt += `ကုန်ပစ္စည်းအကြောင်းအရာ:\n${productDescription}\n\n`;
        }

        if (targetAudience && targetAudience !== 'all') {
          const audienceText = targetAudience === 'male' ? 'ကျား' : 'မ';
          prompt += `ရည်ရွယ်သူ: ${audienceText}\n\n`;
        }

        if (promotion && promotion.trim()) {
          prompt += `ပရိုမိုးရှင်း: ${promotion}\n\n`;
        }

        prompt += `ကျေးဇူးပြု၍:\n`;
        prompt += `- ဆွဲဆောင်မှုရှိသော၊ စိတ်ဝင်စားဖွယ်ကောင်းသော စာသားဖြစ်ရမည်\n`;
        prompt += `- မြန်မာစာ စာလုံးပေါင်း မှန်ကန်ရမည်\n`;
        prompt += `- Facebook post အတွက် သင့်လျော်သော အရှည်ဖြစ်ရမည် (၁၅၀-၃၀၀ စာလုံး)\n`;
        prompt += `- Emoji များ ထည့်သွင်းနိုင်သည်\n`;
        prompt += `- Call-to-action ပါဝင်ရမည်`;
      } else if (type === 'slogan') {
        prompt = `မြန်မာဘာသာဖြင့် "${productName}" အတွက် ဆွဲဆောင်မှုရှိသော ဆောင်ပုဒ် (Slogan) ၃-၅ ခု ဖန်တီးပေးပါ။\n\n`;
        if (productDescription && productDescription.trim()) {
          prompt += `ကုန်ပစ္စည်းအကြောင်းအရာ:\n${productDescription}\n\n`;
        }
        prompt += `ဆောင်ပုဒ်များသည်:\n`;
        prompt += `- တိုတောင်း၍ မှတ်မိလွယ်ရမည်\n`;
        prompt += `- ဆွဲဆောင်မှုရှိရမည်\n`;
        prompt += `- ကုန်ပစ္စည်း၏ အဓိကအချက်အလက်ကို ဖော်ပြရမည်`;
      } else if (type === 'hashtag') {
        prompt = `မြန်မာဘာသာနှင့် အင်္ဂလိပ်ဘာသာ hashtag များ ဖန်တီးပေးပါ။ "${productName}" အတွက် Facebook post အတွက် သင့်လျော်သော hashtag ၁၀-၁၅ ခု။\n\n`;
        if (productDescription && productDescription.trim()) {
          prompt += `ကုန်ပစ္စည်းအကြောင်းအရာ:\n${productDescription}\n\n`;
        }
        prompt += `Hashtag များသည်:\n`;
        prompt += `- ရှာဖွေရလွယ်ကူရမည်\n`;
        prompt += `- ကုန်ပစ္စည်းနှင့် သက်ဆိုင်ရမည်\n`;
        prompt += `- မြန်မာနှင့် အင်္ဂလိပ် hashtag နှစ်မျိုးလုံး ပါဝင်ရမည်`;
      } else if (type === 'variations') {
        prompt = `မြန်မာဘာသာဖြင့် "${productName}" အတွက် Facebook ကြော်ငြာစာသား ပုံစံကွဲ ၃ ခု ဖန်တီးပေးပါ။\n\n`;
        if (productDescription && productDescription.trim()) {
          prompt += `ကုန်ပစ္စည်းအကြောင်းအရာ:\n${productDescription}\n\n`;
        }
        if (targetAudience && targetAudience !== 'all') {
          const audienceText = targetAudience === 'male' ? 'ကျား' : 'မ';
          prompt += `ရည်ရွယ်သူ: ${audienceText}\n\n`;
        }
        if (promotion && promotion.trim()) {
          prompt += `ပရိုမိုးရှင်း: ${promotion}\n\n`;
        }
        prompt += `ပုံစံကွဲ ၃ ခု:\n`;
        prompt += `1. တိုတောင်း၍ စွဲမက်ဖွယ် (၁၀၀-၁၅၀ စာလုံး)\n`;
        prompt += `2. အသေးစိတ် ရှင်းလင်းသော (၂၀၀-၃၀၀ စာလုံး)\n`;
        prompt += `3. ပရိုမိုးရှင်းကို အဓိကထားသော (၁၅၀-၂၀၀ စာလုံး)`;

      }

      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      // Set appropriate state based on type
      if (type === 'post') {
        setPostText(generatedText.trim());
        // Auto-advance to step 2 after post is generated
        setCurrentStep(2);
      } else if (type === 'slogan') {
        setSloganText(generatedText.trim());
      } else if (type === 'hashtag') {
        setHashtagText(generatedText.trim());
      } else if (type === 'variations') {
        setVariationsText(generatedText.trim());
      }

    } catch (error: any) {
      console.error('Generate error:', error);

      let errorMessage = 'စာသားဖန်တီးရာတွင် အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်';

      if (error.message) {
        if (error.message.includes('API_KEY') || error.message.includes('API key')) {
          errorMessage = 'API Key မမှန်ကန်ပါ။ ကျေးဇူးပြု၍ API Key ကို စစ်ဆေးပါ';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = `Model "${modelName}" ကို ရှာမတွေ့ပါ။ ကျေးဇူးပြု၍ အခြား model ကို ရွေးချယ်ပါ`;
        } else if (error.message.includes('400')) {
          errorMessage = 'API request မမှန်ကန်ပါ။ ကျေးဇူးပြု၍ အချက်အလက်များကို စစ်ဆေးပါ';
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      // Reset appropriate loading state
      if (type === 'post') {
        setIsGeneratingPost(false);
      } else if (type === 'slogan') {
        setIsGeneratingSlogan(false);
      } else if (type === 'hashtag') {
        setIsGeneratingHashtag(false);
      } else if (type === 'variations') {
        setIsGeneratingVariations(false);
      }
    }
  };

  const handleGenerate = () => generateContent('post');
  const handleGenerateSlogan = () => generateContent('slogan');
  const handleGenerateHashtag = () => generateContent('hashtag');
  const handleGenerateVariations = () => generateContent('variations');

  const handleCopy = (type: 'post' | 'slogan' | 'hashtag' | 'variations') => {
    let textToCopy = '';
    if (type === 'post') {
      textToCopy = postText;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        setIsCopiedPost(true);
        setTimeout(() => setIsCopiedPost(false), 2000);
      }
    } else if (type === 'slogan') {
      textToCopy = sloganText;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        setIsCopiedSlogan(true);
        setTimeout(() => setIsCopiedSlogan(false), 2000);
      }
    } else if (type === 'hashtag') {
      textToCopy = hashtagText;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        setIsCopiedHashtag(true);
        setTimeout(() => setIsCopiedHashtag(false), 2000);
      }
    } else if (type === 'variations') {
      textToCopy = variationsText;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        setIsCopiedVariations(true);
        setTimeout(() => setIsCopiedVariations(false), 2000);
      }
    }
  };

  const handleClear = () => {
    setProductName('');
    setProductDescription('');
    setTargetAudience('all');
    setPromotion('');
    setPostText('');
    setSloganText('');
    setHashtagText('');
    setVariationsText('');
    setCurrentStep(1);
  };

  const steps = [
    { number: 1, title: 'အချက်အလက်ထည့်သွင်းရန်', icon: Bot },
    { number: 2, title: 'စာသားဖန်တီးရန်', icon: FileText },
    { number: 3, title: 'အပိုပစ္စည်းများ', icon: Sparkles },
  ];

  const canProceedToStep2 = productName.trim() !== '';
  const canProceedToStep3 = postText.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-4">
        <div className="w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">နောက်သို့</span>
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <Settings size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">API Config</span>
            {localStorage.getItem(STORAGE_KEY) && (
              <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto">
          {/* Title */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold text-white mb-2 md:mb-3">
              မြန်မာစာ AI ကြော်ငြာစာသား ဖန်တီးသူ
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 px-4">
              ကုန်ပစ္စည်းအချက်အလက်များထည့်သွင်းပြီး ဆွဲဆောင်မှုရှိသော ကြော်ငြာစာသားများရယူပါ
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6 mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const isAccessible = step.number === 1 || (step.number === 2 && canProceedToStep2) || (step.number === 3 && canProceedToStep3);

                return (
                  <React.Fragment key={step.number}>
                    <div className="flex items-center flex-1">
                      <div
                        className={`flex flex-col items-center flex-1 cursor-pointer ${isAccessible ? '' : 'opacity-50 cursor-not-allowed'
                          }`}
                        onClick={() => isAccessible && setCurrentStep(step.number)}
                      >
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-all ${isActive
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : isCompleted
                              ? 'bg-green-600 border-green-500 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-400'
                            }`}
                        >
                          {isCompleted ? (
                            <Check size={24} />
                          ) : (
                            <Icon size={24} />
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs md:text-sm font-semibold ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                            Step {step.number}
                          </p>
                          <p className={`text-xs md:text-sm mt-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {step.title}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 md:mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-700'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6 lg:p-8">
            {/* Step 1: Input Form */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <Bot className="text-blue-400" size={24} />
                  Step 1: အချက်အလက်ထည့်သွင်းရန်
                </h2>

                <div className="space-y-4 md:space-y-5">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      ကုန်ပစ္စည်းအမည်
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="ဥပမာ - Organic Coffee"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Product Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      ကုန်ပစ္စည်းအကြောင်းအရာ
                    </label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="အရည်အသွေး၊ ပါဝင်ပစ္စည်း၊ အကျိုးကျေးဇူးများ"
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      ရည်ရွယ်သူ
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white"
                    >
                      <option value="all">အားလုံး</option>
                      <option value="male">ကျား</option>
                      <option value="female">မ</option>
                    </select>
                  </div>

                  {/* Promotion */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      ပရိုမိုးရှင်း
                    </label>
                    <input
                      type="text"
                      value={promotion}
                      onChange={(e) => setPromotion(e.target.value)}
                      placeholder="ဥပမာ - 20% လျှော့ဈေး"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-500"
                    />
                  </div>

                </div>
                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleClear}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    ရှင်းလင်းမည်
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    နောက်တစ်ဆင့်
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Generate Main Post */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <FileText className="text-blue-400" size={24} />
                  Step 2: စာသားဖန်တီးရန်
                </h2>

                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Post Creator</h3>
                    {postText && (
                      <button
                        onClick={() => handleCopy('post')}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        {isCopiedPost ? (
                          <>
                            <Check size={16} />
                            ကူးယူပြီး
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            ကူးယူပါ
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={postText}
                    readOnly
                    placeholder="စာသားဖန်တီးပါ button ကို နှိပ်ပြီး စာသားဖန်တီးပါ..."
                    rows={15}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-500"
                  />
                  {isGeneratingPost && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm font-medium">စာသားဖန်တီးနေသည်...</span>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-3 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    နောက်သို့
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGeneratingPost || !productName.trim()}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      {isGeneratingPost ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          ဖန်တီးနေသည်...
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          စာသားဖန်တီးပါ
                        </>
                      )}
                    </button>
                    {canProceedToStep3 && (
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        နောက်တစ်ဆင့်
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Content */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={24} />
                  Step 3: အပိုပစ္စည်းများ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                  {/* Slogan */}
                  <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Type className="text-purple-400" size={20} />
                        ဆောင်ပုဒ်
                      </h3>
                      {sloganText && (
                        <button
                          onClick={() => handleCopy('slogan')}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                        >
                          {isCopiedSlogan ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={sloganText}
                      readOnly
                      placeholder="ဆောင်ပုဒ် ဖန်တီးပါ button ကို နှိပ်ပါ..."
                      rows={12}
                      className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-500 text-sm"
                    />
                    {isGeneratingSlogan && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-purple-400">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-xs">ဖန်တီးနေသည်...</span>
                      </div>
                    )}
                    <button
                      onClick={handleGenerateSlogan}
                      disabled={isGeneratingSlogan || !postText.trim()}
                      className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Type size={16} />
                      ဆောင်ပုဒ် ဖန်တီးပါ
                    </button>
                  </div>

                  {/* Hashtag */}
                  <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Hash className="text-green-400" size={20} />
                        Hashtag
                      </h3>
                      {hashtagText && (
                        <button
                          onClick={() => handleCopy('hashtag')}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                        >
                          {isCopiedHashtag ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={hashtagText}
                      readOnly
                      placeholder="Hashtag ဖန်တီးပါ button ကို နှိပ်ပါ..."
                      rows={12}
                      className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-500 text-sm"
                    />
                    {isGeneratingHashtag && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-green-400">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-xs">ဖန်တီးနေသည်...</span>
                      </div>
                    )}
                    <button
                      onClick={handleGenerateHashtag}
                      disabled={isGeneratingHashtag || !postText.trim()}
                      className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Hash size={16} />
                      Hashtag ဖန်တီးပါ
                    </button>
                  </div>

                  {/* Variations */}
                  <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 md:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Layers className="text-indigo-400" size={20} />
                        အခြား Post
                      </h3>
                      {variationsText && (
                        <button
                          onClick={() => handleCopy('variations')}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                        >
                          {isCopiedVariations ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={variationsText}
                      readOnly
                      placeholder="ပုံစံကွဲများ ဖန်တီးပါ button ကို နှိပ်ပါ..."
                      rows={12}
                      className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-500 text-sm"
                    />
                    {isGeneratingVariations && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-indigo-400">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-xs">ဖန်တီးနေသည်...</span>
                      </div>
                    )}
                    <button
                      onClick={handleGenerateVariations}
                      disabled={isGeneratingVariations || !postText.trim()}
                      className="mt-3 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Layers size={16} />
                      ပုံစံကွဲများ
                    </button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-3 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    နောက်သို့
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    အားလုံး ရှင်းလင်းမည်
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-700 bg-gray-900 rounded-t-lg">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} />
                API Configuration
              </h2>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
              {localStorage.getItem(STORAGE_KEY) && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
                  <Check className="text-green-400" size={18} />
                  <p className="text-sm text-green-400">Saved configuration loaded</p>
                </div>
              )}
              {/* API Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                {saveConfig && localStorage.getItem(STORAGE_KEY) && (
                  <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                    <Check size={12} />
                    Configuration saved
                  </p>
                )}
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Model Name
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white"
                >
                  {availableModels.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="saveConfig"
                  checked={saveConfig}
                  onChange={(e) => setSaveConfig(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                />
                <label htmlFor="saveConfig" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Save API Key and Model Name
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={18} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreatorAI;
