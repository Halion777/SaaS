import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import { useAuth } from '../../../context/AuthContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, sendPasswordReset } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'adresse email est requise';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await login(formData.email, formData.password);
      
      if (error) {
        setErrors({
          general: error.message || 'Échec de connexion. Vérifiez vos informations.'
        });
        setIsLoading(false);
        return;
      }
      
      // Login successful - redirect is handled by AuthContext
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
    } catch (error) {
      setErrors({
        general: 'Une erreur s\'est produite. Veuillez réessayer.'
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({
        email: 'Entrez votre email pour réinitialiser le mot de passe'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await sendPasswordReset(formData.email);
      
      if (error) {
        setErrors({
          general: error.message || 'Erreur lors de l\'envoi du lien de réinitialisation'
        });
      } else {
        setResetSent(true);
      }
    } catch (error) {
      setErrors({
        general: 'Une erreur s\'est produite. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {resetSent ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} color="#10B981" />
            <p className="text-sm text-green-700">
              Un lien de réinitialisation a été envoyé à votre adresse email.
            </p>
          </div>
        </div>
      ) : errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} color="#EF4444" />
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Adresse email"
            type="email"
            name="email"
            placeholder="votre@email.fr"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
            disabled={isLoading}
          />

          <Input
            label="Mot de passe"
            type="password"
            name="password"
            placeholder="Votre mot de passe"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            label="Se souvenir de moi"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-primary hover:text-primary/80 transition-colors duration-150"
            disabled={isLoading}
          >
            Mot de passe oublié ?
          </button>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Se connecter
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;