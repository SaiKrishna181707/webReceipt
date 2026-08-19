'use client'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'

interface FormInputProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'url'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  success?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
}

export function FormInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  success,
  helpText,
  required = false,
  disabled = false,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type
  const hasValue = value.length > 0
  const showError = error && isTouched
  const showSuccess = success && !showError && hasValue

  return (
    <div className="relative">
      {/* Floating Label */}
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFocused || hasValue
            ? 'top-2 text-xs text-purple-400'
            : 'top-1/2 -translate-y-1/2 text-gray-400'
        }`}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            setIsTouched(true)
          }}
          placeholder=" "
          disabled={disabled}
          className={`w-full bg-white/5 border rounded-xl pt-6 pb-2 px-4 text-white outline-none transition-all duration-200 ${
            isFocused
              ? 'border-purple-500 ring-2 ring-purple-500/20'
              : showError
              ? 'border-red-500'
              : showSuccess
              ? 'border-green-500'
              : 'border-white/10 hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Status Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {showError && <AlertCircle size={18} className="text-red-500" />}
          {showSuccess && <Check size={18} className="text-green-500" />}
        </div>
      </div>

      {/* Validation Messages */}
      <div className="mt-2 space-y-1">
        {showError && (
          <p className="text-sm text-red-400 flex items-center gap-1 animate-fade-in">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        {showSuccess && (
          <p className="text-sm text-green-400 flex items-center gap-1 animate-fade-in">
            <Check size={14} />
            {success}
          </p>
        )}
        {helpText && !showError && (
          <p className="text-sm text-gray-400">{helpText}</p>
        )}
      </div>
    </div>
  )
}

// Multi-step form component
interface FormStepProps {
  currentStep: number
  totalSteps: number
  onStepChange: (step: number) => void
  children: React.ReactNode
}

export function FormStep({ currentStep, totalSteps, onStepChange, children }: FormStepProps) {
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {index < currentStep ? <Check size={18} /> : index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                  index < currentStep ? 'bg-green-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-white/10">
        <button
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
          className="px-6 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
        >
          Previous
        </button>
        <button
          onClick={() => onStepChange(currentStep + 1)}
          disabled={currentStep === totalSteps - 1}
          className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  )
}