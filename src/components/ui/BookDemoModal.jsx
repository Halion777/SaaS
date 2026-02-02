import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay
} from 'date-fns';
import { fr, enUS, nl } from 'date-fns/locale';
import Icon from '../AppIcon';
import Input from './Input';
import Button from './Button';
import bookDemoService from '../../services/bookDemoService';

const MOBILE_BREAKPOINT = 768;

const localeMap = { fr, en: enUS, nl };
const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BookDemoModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    preferredDates: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  const locale = useMemo(() => localeMap[i18n.language?.split('-')[0]] || enUS, [i18n.language]);

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const weeks = [];
    let day = new Date(start);
    while (day <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(day));
        day = addDays(day, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [calendarMonth]);

  useEffect(() => {
    if (isOpen) setCalendarMonth(new Date());
  }, [isOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDateToggle = (dateValue) => {
    const iso = typeof dateValue === 'string' ? dateValue : format(dateValue, 'yyyy-MM-dd');
    setFormData((prev) => ({
      ...prev,
      preferredDates: prev.preferredDates.includes(iso)
        ? prev.preferredDates.filter((d) => d !== iso)
        : [...prev.preferredDates, iso]
    }));
    if (errors.preferredDates) setErrors((prev) => ({ ...prev, preferredDates: '' }));
  };

  const isDateSelectable = (date) => {
    const today = startOfDay(new Date());
    return !isBefore(startOfDay(date), today);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = t('bookDemo.form.errors.nameRequired');
    if (!formData.companyName?.trim()) newErrors.companyName = t('bookDemo.form.errors.companyRequired');
    if (!formData.phone?.trim()) newErrors.phone = t('bookDemo.form.errors.phoneRequired');
    if (!formData.email?.trim()) newErrors.email = t('bookDemo.form.errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('bookDemo.form.errors.emailInvalid');
    if (!formData.preferredDates?.length) newErrors.preferredDates = t('bookDemo.form.errors.datesRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await bookDemoService.submitBookDemo(
        {
          name: formData.name.trim(),
          companyName: formData.companyName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          preferredDates: formData.preferredDates,
        },
        i18n.language
      );
      if (result.success) {
        setIsSubmitted(true);
        setFormData({ name: '', companyName: '', phone: '', email: '', preferredDates: [] });
      } else {
        setErrors({ submit: result.error || t('bookDemo.form.errors.submitFailed') });
      }
    } catch (err) {
      setErrors({ submit: err.message || t('bookDemo.form.errors.submitFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', companyName: '', phone: '', email: '', preferredDates: [] });
      setErrors({});
      setIsSubmitted(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[10000]" onClick={handleClose} aria-hidden="true" />
      <div
        className={`fixed z-[10001] bg-white shadow-xl flex flex-col ${
          isMobile
            ? 'inset-x-0 bottom-0 top-[28%] rounded-none max-h-[72vh]'
            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] rounded-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={isSubmitted ? undefined : 'book-demo-title'}
      >
        {!isSubmitted && (
          <div className={`flex items-center justify-between flex-shrink-0 bg-[#12bf23]/15 border-b-2 border-[#12bf23]/25 shadow-sm ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
            <h2 id="book-demo-title" className={`font-semibold text-[#166534] ${isMobile ? 'text-base' : 'text-lg'}`}>
              {t('bookDemo.title')}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-none hover:bg-[#12bf23]/20 transition-colors text-[#166534]"
              aria-label={t('bookDemo.close')}
            >
              <Icon name="X" size={20} className="text-[#166534]" />
            </button>
          </div>
        )}

        <div className={`flex-1 min-h-0 overflow-y-auto bg-gray-50/40 ${isMobile ? 'p-3' : 'p-4 md:p-6'}`}>
          {isSubmitted ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-[#12bf23]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-[#12bf23]" />
              </div>
              <p className="text-gray-700 font-medium">{t('bookDemo.success')}</p>
              <Button
                type="button"
                className="mt-4 bg-[#12bf23] hover:bg-[#12bf23]/90 text-white rounded-none"
                onClick={handleClose}
              >
                {t('bookDemo.close')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={`flex flex-col min-h-0 border border-gray-200/80 bg-white shadow-sm ${isMobile ? 'space-y-2.5 p-2.5' : 'space-y-3 p-4'}`}>
              <div className={isMobile ? 'flex flex-col gap-2.5' : 'space-y-3'}>
                <div className="flex gap-2 items-center">
                  <div className={`${isMobile ? 'w-8' : 'w-9'} h-9 rounded-none bg-[#12bf23]/10 flex items-center justify-center flex-shrink-0`}>
                    <Icon name="User" size={isMobile ? 16 : 18} className="text-[#12bf23]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      required
                      placeholder={t('bookDemo.form.namePlaceholder')}
                      className={`rounded-none ${isMobile ? '!mb-0' : ''}`}
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className={`${isMobile ? 'w-8' : 'w-9'} h-9 rounded-none bg-[#12bf23]/10 flex items-center justify-center flex-shrink-0`}>
                    <Icon name="Building2" size={isMobile ? 16 : 18} className="text-[#12bf23]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      error={errors.companyName}
                      required
                      placeholder={t('bookDemo.form.companyPlaceholder')}
                      className={`rounded-none ${isMobile ? '!mb-0' : ''}`}
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-9 h-9 rounded-none bg-[#12bf23]/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Phone" size={18} className="text-[#12bf23]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                      placeholder={t('bookDemo.form.phonePlaceholder')}
                      className={`rounded-none ${isMobile ? '!mb-0' : ''}`}
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className={`${isMobile ? 'w-8' : 'w-9'} h-9 rounded-none bg-[#12bf23]/10 flex items-center justify-center flex-shrink-0`}>
                    <Icon name="Mail" size={isMobile ? 16 : 18} className="text-[#12bf23]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                      placeholder={t('bookDemo.form.emailPlaceholder')}
                      className={`rounded-none ${isMobile ? '!mb-0' : ''}`}
                    />
                  </div>
                </div>
              </div>
              <div className={isMobile ? 'flex-shrink-0' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                  {t('bookDemo.form.preferredDatesLabel')}
                </label>
                <p className={`text-gray-500 text-center mb-1.5 ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
                  {t('bookDemo.form.preferredDatesHint')}
                </p>
                <div className={`border border-gray-200 rounded-xl bg-gray-50/50 ${isMobile ? 'p-2' : 'p-3'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
                      className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      aria-label={t('bookDemo.form.prevMonth')}
                    >
                      <Icon name="ChevronLeft" size={18} className="text-gray-600" />
                    </button>
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {format(calendarMonth, 'MMMM yyyy', { locale })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                      className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      aria-label={t('bookDemo.form.nextMonth')}
                    >
                      <Icon name="ChevronRight" size={18} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {WEEKDAY_HEADERS.map((d) => (
                      <div key={d} className="text-xs font-medium text-gray-500 py-1">
                        {d}
                      </div>
                    ))}
                    {calendarWeeks.map((week, wi) =>
                      week.map((date) => {
                        const iso = format(date, 'yyyy-MM-dd');
                        const inMonth = isSameMonth(date, calendarMonth);
                        const selectable = isDateSelectable(date);
                        const selected = formData.preferredDates.includes(iso);
                        return (
                          <button
                            key={wi + iso}
                            type="button"
                            disabled={!selectable}
                            onClick={() => selectable && handleDateToggle(iso)}
                            className={`
                              py-1.5 text-sm min-w-0 rounded-none transition-colors
                              ${!inMonth ? 'text-gray-300' : ''}
                              ${selectable ? 'hover:bg-[#12bf23]/20 cursor-pointer' : 'cursor-not-allowed opacity-60'}
                              ${selected ? 'bg-[#12bf23] text-white font-medium' : inMonth ? 'text-gray-800' : ''}
                            `}
                          >
                            {format(date, 'd')}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                {errors.preferredDates && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.preferredDates}</p>
                )}
              </div>
              {errors.submit && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-none">{errors.submit}</p>
              )}
              <div className={`flex gap-2 flex-shrink-0 ${isMobile ? 'pt-1.5 min-h-[44px]' : 'pt-2'}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className={`flex-1 rounded-none ${isMobile ? 'min-h-[44px]' : ''}`}
                  disabled={isSubmitting}
                >
                  {t('bookDemo.form.cancel')}
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 bg-[#12bf23] hover:bg-[#12bf23]/90 text-white rounded-none ${isMobile ? 'min-h-[44px]' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('bookDemo.form.sending') : t('bookDemo.form.submit')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default BookDemoModal;
