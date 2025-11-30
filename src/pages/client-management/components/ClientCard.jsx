import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ClientCard = ({ client, onSelect, onDelete, onStatusToggle, getStatusColor, canEdit = true, canDelete = true }) => {
  const { t, i18n } = useTranslation();
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const getCountryLabel = (countryCode) => {
    const countries = {
      'FR': t('clientManagement.countries.FR'),
      'BE': t('clientManagement.countries.BE'),
      'CH': t('clientManagement.countries.CH'),
      'LU': t('clientManagement.countries.LU'),
      'CA': t('clientManagement.countries.CA'),
      'US': t('clientManagement.countries.US'),
      'DE': t('clientManagement.countries.DE'),
      'IT': t('clientManagement.countries.IT'),
      'ES': t('clientManagement.countries.ES'),
      'NL': t('clientManagement.countries.NL'),
      'GB': t('clientManagement.countries.GB'),
      'OTHER': t('clientManagement.countries.OTHER')
    };
    return countries[countryCode] || countryCode;
  };

  const getCompanySizeLabel = (size) => {
    const sizes = {
      'TPE': t('clientManagement.companySizes.TPE'),
      'PME': t('clientManagement.companySizes.PME'),
      'ETI': t('clientManagement.companySizes.ETI'),
      'GE': t('clientManagement.companySizes.GE')
    };
    return sizes[size] || size;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {client.name}
          </h3>
          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.isActive)}`}>
                  {client.isActive ? t('clientManagement.status.active') : t('clientManagement.status.inactive')}
                </span>
            <span className="text-xs text-muted-foreground">
              {client.type === 'professionnel' ? t('clientManagement.types.professional') : t('clientManagement.types.individual')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            iconName="Edit"
            className="text-muted-foreground hover:text-foreground"
            disabled={!canEdit}
            title={!canEdit ? t('permissions.noFullAccess') : t('clientManagement.table.actions.edit')}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            iconName="Trash2"
            className="text-destructive hover:text-destructive/80"
            disabled={!canDelete}
            title={!canDelete ? t('permissions.noFullAccess') : t('clientManagement.table.actions.delete')}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Mail" size={14} />
          <span>{client.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Phone" size={14} />
          <span>{client.phone}</span>
        </div>
        {client.address && (
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <Icon name="MapPin" size={14} className="mt-0.5" />
            <div>
              <div>{client.address}</div>
              {(client.city || client.country || client.postalCode) && (
                <div className="text-xs">
                  {[client.postalCode, client.city, getCountryLabel(client.country)]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Professional Details */}
      {client.type === 'professionnel' && (
        <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
          {client.contactPerson && (
            <div className="flex items-center space-x-2 text-sm">
              <Icon name="User" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">{t('clientManagement.card.contact')}: </span>
              <span className="font-medium">{client.contactPerson}</span>
            </div>
          )}
          {client.companySize && (
            <div className="flex items-center space-x-2 text-sm">
              <Icon name="Building" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">{t('clientManagement.card.size')}: </span>
              <span className="font-medium">{getCompanySizeLabel(client.companySize)}</span>
            </div>
          )}
          {client.regNumber && (
            <div className="flex items-center space-x-2 text-sm">
              <Icon name="FileText" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">{t('clientManagement.card.registrationNumber')}: </span>
              <span className="font-medium">{client.regNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* PEPPOL Status */}
      <div className={`flex items-center space-x-2 mb-4 p-2 rounded-lg ${
        client.peppolConfigured 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-muted/30 border border-border'
      }`}>
        <Icon 
          name={client.peppolConfigured ? "CheckCircle" : "XCircle"} 
          size={16} 
          className={client.peppolConfigured ? "text-green-600" : "text-muted-foreground"} 
        />
        <span className={`text-sm font-medium ${
          client.peppolConfigured ? "text-green-800" : "text-muted-foreground"
        }`}>
          {client.peppolConfigured ? t('clientManagement.peppol.configured') : t('clientManagement.peppol.notConfigured')}
        </span>
        {client.peppolId && client.peppolConfigured && (
          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            {client.peppolId}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(client.totalRevenue)}
          </div>
          <div className="text-xs text-muted-foreground">{t('clientManagement.card.revenue')}</div>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-foreground">
            {client.projectsCount || 0}
          </div>
          <div className="text-xs text-muted-foreground">{t('clientManagement.card.projects')}</div>
        </div>
      </div>



      {/* Communication Preferences */}
      {client.preferences && client.preferences.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {client.preferences.map((pref, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
              >
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClientCard;
