import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import { generateQuotePDF } from '../../../services/pdfService';

const QuoteSendModal = ({ 
  isOpen, 
  onClose, 
  onSend, 
  selectedClient, 
  projectInfo, 
  companyInfo,
  quoteNumber,
  tasks,
  files,
  financialConfig,
  signatureData,
  customization
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: options, 2: email form
  const [sendMethod, setSendMethod] = useState('email'); // 'email' or 'pdf'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [emailData, setEmailData] = useState({
    clientEmail: '',
    sendCopy: false,
    subject: '',
    message: ''
  });

  // Auto-fill email data when component mounts or client changes
  useEffect(() => {
    if (selectedClient && step === 2) {
      const clientEmail = selectedClient.email || selectedClient.client?.email || '';
      const defaultSubject = `Devis ${projectInfo?.description || 'Nouveau projet'} - ${companyInfo?.name || 'Votre entreprise'}`;
      const defaultMessage = `Bonjour,\n\nVeuillez trouver ci-joint notre devis pour votre projet.\n\nCordialement,\n${companyInfo?.name || 'Votre équipe'}`;

      setEmailData({
        clientEmail,
        sendCopy: false,
        subject: defaultSubject,
        message: defaultMessage
      });
    }
  }, [selectedClient, step, projectInfo, companyInfo]);

  const handleOptionSelect = async (method) => {
    setSendMethod(method);
    if (method === 'pdf') {
      // If PDF is selected, generate and download PDF using the same logic as the main PDF button
      try {
        setIsGeneratingPDF(true);
        const quoteData = {
          companyInfo,
          selectedClient,
          tasks,
          files,
          projectInfo,
          financialConfig,
          signatureData,
          customization
        };
        
        // Capture the live preview container for pixel-perfect PDF (same as main button)
        const captureEl = document.querySelector('#quote-preview-capture');
        await generateQuotePDF(quoteData, quoteNumber, captureEl);
        onClose();
      } catch (error) {
        console.error('Error generating PDF:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsGeneratingPDF(false);
      }
    } else {
      // If email is selected, go to step 2
      setStep(2);
    }
  };

  const handleEmailSend = () => {
    onSend({ 
      method: 'email', 
      emailData: {
        ...emailData,
        quoteNumber,
        clientName: selectedClient?.name || selectedClient?.label || 'Client',
        // Include user's email if sendCopy is enabled
        userEmail: emailData.sendCopy ? user?.email : null
      },
      // Pass all the required quote data
      companyInfo,
      financialConfig,
      signatureData,
      selectedClient,
      projectInfo,
      tasks,
      files,
      customization
    });
    onClose();
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
                 <div className="flex items-center justify-between p-6 border-b border-border">
           <h2 className="text-xl font-bold text-foreground">
             {step === 1 ? 'Partager un devis' : 'Envoyer un devis'}
           </h2>
           <button
             onClick={onClose}
             className="text-muted-foreground hover:text-foreground transition-colors"
           >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Choose sending method
            <div className="space-y-4">
                             {/* Info box */}
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                 <div className="flex items-start">
                   <div className="flex-shrink-0">
                     <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                   </div>
                   <div className="ml-3">
                     <p className="text-sm text-blue-700">
                       Une fois que vous aurez envoyé ce devis, le statut passera à "En attente". 
                       {selectedClient?.name || selectedClient?.label || 'Le client'} aura jusqu'au {projectInfo?.deadline ? new Date(projectInfo.deadline).toLocaleDateString('fr-FR') : '30 jours'} pour répondre à ce devis.
                     </p>
                   </div>
                 </div>
               </div>

                             <div>
                 <h3 className="text-lg font-semibold text-foreground mb-4">
                   Comment souhaitez-vous envoyer ce devis ?
                 </h3>
                
                <div className="space-y-3">
                                     {/* Email option */}
                   <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                     sendMethod === 'email' 
                       ? 'border-primary bg-primary/10' 
                       : 'border-border hover:border-primary/50'
                   }`}>
                     <input
                       type="radio"
                       name="sendMethod"
                       value="email"
                       checked={sendMethod === 'email'}
                       onChange={() => setSendMethod('email')}
                       className="sr-only"
                     />
                     <div className={`relative w-5 h-5 mr-3 flex items-center justify-center rounded-full border-2 aspect-square ${
                       sendMethod === 'email' ? 'border-primary' : 'border-border'
                     }`}>
                       {sendMethod === 'email' && (
                         <div className="w-2.5 h-2.5 bg-primary rounded-full aspect-square"></div>
                       )}
                     </div>
                     <div>
                       <div className="font-medium text-foreground">
                         Envoyer par e-mail via Haliqo
                       </div>
                       <div className="text-sm text-muted-foreground">
                         Cliquez sur "Continuer" pour voir l'e-mail avant de l'envoyer
                       </div>
                     </div>
                   </label>

                                       {/* PDF option */}
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      sendMethod === 'pdf' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    } ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="sendMethod"
                        value="pdf"
                        checked={sendMethod === 'pdf'}
                        onChange={() => setSendMethod('pdf')}
                        disabled={isGeneratingPDF}
                        className="sr-only"
                      />
                      <div className={`relative w-5 h-5 mr-3 flex items-center justify-center rounded-full border-2 aspect-square ${
                        sendMethod === 'pdf' ? 'border-primary' : 'border-border'
                      }`}>
                        {sendMethod === 'pdf' && (
                          <div className="w-2.5 h-2.5 bg-primary rounded-full aspect-square"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {isGeneratingPDF ? 'Génération PDF...' : 'Télécharger le devis au format PDF'}
                        </div>
                      </div>
                    </label>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Email form
            <div className="space-y-4">
              <div className="space-y-4">
                                 {/* Client Email */}
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Adresse e-mail du client
                   </label>
                  <Input
                    type="email"
                    value={emailData.clientEmail}
                    onChange={(e) => setEmailData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="email@client.com"
                    className="w-full"
                  />
                </div>

                                 {/* Send Copy Toggle */}
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-medium text-foreground">
                     Envoyez-moi une copie
                   </label>
                   <div className="flex items-center">
                     <span className="text-sm text-muted-foreground mr-2">Non</span>
                    <button
                      type="button"
                      onClick={() => setEmailData(prev => ({ ...prev, sendCopy: !prev.sendCopy }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        emailData.sendCopy ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          emailData.sendCopy ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                                         <span className="text-sm text-muted-foreground ml-2">Oui</span>
                  </div>
                </div>

                                 {/* Email Subject */}
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Objet de l'e-mail
                   </label>
                  <Input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Objet de l'e-mail"
                    className="w-full"
                  />
                </div>

                                 {/* Email Message */}
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Message
                   </label>
                                     <textarea
                     value={emailData.message}
                     onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                     rows={4}
                     className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                     placeholder="Votre message..."
                   />
                </div>

                                 {/* Quote Info Preview */}
                 <div className="bg-muted border border-border rounded-lg p-4">
                   <div className="text-sm text-muted-foreground space-y-1">
                     <p>Vous avez reçu un devis</p>
                     <p>De la part de {companyInfo?.name || 'Votre entreprise'}</p>
                     <p>Numéro du devis: {quoteNumber}</p>
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>

                 {/* Footer */}
         <div className="flex justify-between items-center p-6 border-t border-border">
           <Button
             variant="outline"
             onClick={handleBack}
             className="px-4 py-2"
           >
             {step === 1 ? 'Annuler' : 'Retour'}
           </Button>
           
           <Button
             onClick={step === 1 ? () => handleOptionSelect(sendMethod) : handleEmailSend}
             className="px-4 py-2"
             disabled={isGeneratingPDF}
           >
             {step === 1 ? (isGeneratingPDF ? 'Génération...' : 'Confirmer') : 'Envoyer'}
           </Button>
         </div>
      </div>
    </div>
  );
};

export default QuoteSendModal;
