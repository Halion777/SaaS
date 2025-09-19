import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import TableLoader from '../../../../components/ui/TableLoader';
import Icon from '../../../../components/AppIcon';
import PeppolService from '../../../../services/peppolService';

const PeppolParticipants = () => {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [sidebarOffset, setSidebarOffset] = useState(0);

  const peppolService = new PeppolService(true); // Use test environment

  useEffect(() => {
    loadParticipants();
    
    // Handle sidebar toggle
    const handleSidebarToggle = () => {
      const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
      setSidebarOffset(isCollapsed ? 80 : 280);
    };

    // Set initial sidebar state
    const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
    setSidebarOffset(isCollapsed ? 80 : 280);

    // Listen for sidebar toggle events
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const data = await peppolService.getPeppolParticipants();
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParticipant = () => {
    setEditingParticipant(null);
    setShowModal(true);
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipant(participant);
    setShowModal(true);
  };

  const handleDeleteParticipant = async (id) => {
    if (window.confirm(t('peppol.participants.confirmDelete'))) {
      try {
        await peppolService.deletePeppolParticipant(id);
        await loadParticipants();
      } catch (error) {
        console.error('Error deleting participant:', error);
      }
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.vat_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.peppol_identifier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || participant.participant_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'sender': return 'text-blue-600 bg-blue-100';
      case 'receiver': return 'text-purple-600 bg-purple-100';
      case 'both': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div 
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('peppol.participants.title')}</h1>
                <p className="text-gray-600 mt-1">{t('peppol.participants.subtitle')}</p>
              </div>
              <Button onClick={handleCreateParticipant} className="flex items-center gap-2">
                <Icon name="Plus" className="w-4 h-4" />
                {t('peppol.participants.addParticipant')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder={t('peppol.participants.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">{t('peppol.participants.allTypes')}</option>
                  <option value="sender">{t('peppol.participants.sender')}</option>
                  <option value="receiver">{t('peppol.participants.receiver')}</option>
                  <option value="both">{t('peppol.participants.both')}</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-8">
                <TableLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.participants.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.participants.vatNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.participants.peppolId')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.participants.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.participants.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.participants.createdAt')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          {t('peppol.participants.noParticipants')}
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((participant) => (
                        <tr key={participant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {participant.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {participant.city}, {participant.country}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participant.vat_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participant.peppol_identifier || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(participant.participant_type)}`}>
                              {t(`peppol.participants.${participant.participant_type}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(participant.is_active ? 'active' : 'inactive')}`}>
                              {participant.is_active ? t('common.active') : t('common.inactive')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(participant.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditParticipant(participant)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteParticipant(participant.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeppolParticipants;
