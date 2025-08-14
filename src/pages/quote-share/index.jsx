import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuoteByShareToken } from '../../services/shareService';
import { getSignedUrl } from '../../services/storageService';

const currency = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0)) + '€';

const PublicQuoteShareViewer = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const res = await getQuoteByShareToken(token);
        if (!res?.success) {
          setError(res?.error || 'Lien invalide.');
          return;
        }
        const q = res.data;
        setQuote(q);
        // Build signed URLs for private assets if present
        try {
          if (q?.company_profile?.logo_path) {
            const { data } = await getSignedUrl('company-assets', q.company_profile.logo_path, 3600);
            if (data) setLogoUrl(data);
          }
          if (q?.company_profile?.signature_path) {
            const { data } = await getSignedUrl('company-assets', q.company_profile.signature_path, 3600);
            if (data) setSignatureUrl(data);
          }
        } catch (_) {}
      } catch (e) {
        setError('Erreur lors du chargement du devis.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement du devis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 underline">Retour à l'accueil</Link>
      </div>
    );
  }

  // Build grouped preview similar to in-app QuotePreview (simplified styling)
  const tasks = (quote?.quote_tasks || []).map(t => ({
    ...t,
    materials: (quote?.quote_materials || []).filter(m => m.quote_task_id === t.id)
  }));
  let includeMaterialsPrices = true;
  try {
    const stored = localStorage.getItem('include-materials-prices');
    if (stored != null) includeMaterialsPrices = stored === 'true';
  } catch (_) {}
  const tasksSubtotal = tasks.reduce((s, t) => {
    const mat = (t.materials || []).reduce((ms, m) => ms + (Number(m.quantity||0)*Number(m.unit_price||0)), 0);
    return s + Number(t.total_price || 0) + mat;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg">
        <div className="p-4 sm:p-6 border-b flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            ) : null}
            <div>
              <div className="text-lg font-semibold">{quote?.company_profile?.company_name || 'YOUR BUSINESS'}</div>
              <div className="text-xs text-gray-500">{quote?.company_profile?.address}</div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-700">
            <div className="text-xs text-gray-500">DEVIS</div>
            <div className="font-semibold">{quote?.quote_number || quote?.id}</div>
            {quote?.created_at && (
              <div className="text-xs text-gray-500">Date: {new Date(quote.created_at).toLocaleDateString('fr-FR')}</div>
            )}
            {quote?.valid_until && (
              <div className="text-xs text-gray-500">Valide jusqu'au: {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500">Client</div>
            <div className="text-base text-gray-800">{quote?.client?.name}</div>
            <div className="text-sm text-gray-500">{quote?.client?.email}</div>
          </div>

          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-center">Qté</th>
                  <th className="p-2 text-right">PU</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, idx) => {
                  const hours = Number(t.duration||0) > 0 ? Number(t.duration) : 1;
                  const laborTotal = Number(t.total_price||0);
                  const unit = hours > 0 ? laborTotal / hours : laborTotal;
                  return (
                    <React.Fragment key={t.id}>
                      <tr className="bg-gray-50">
                        <td className="p-2 text-left align-top">{idx+1}.1</td>
                        <td className="p-2 align-top">
                          <div className="font-medium">{t.description || t.name || `Tâche ${idx+1}`}</div>
                        </td>
                        <td className="p-2 text-center align-top">{hours.toFixed(2)} h</td>
                        <td className="p-2 text-right align-top">{currency(unit)}</td>
                        <td className="p-2 text-right align-top font-semibold">{currency(laborTotal)}</td>
                      </tr>
                      {(t.materials||[]).map((m, mi) => {
                        const qty = Number(m.quantity||0);
                        const pu = Number(m.unit_price||0);
                        const line = qty*pu;
                        return (
                          <tr key={`${t.id}-${m.id}`}>
                            <td className="p-2 text-left">{idx+1}.{mi+2}</td>
                            <td className="p-2">{m.name}</td>
                            <td className="p-2 text-center">{qty.toFixed(2)} {m.unit||''}</td>
                            <td className="p-2 text-right">{includeMaterialsPrices ? currency(pu) : ''}</td>
                            <td className="p-2 text-right font-medium">{includeMaterialsPrices ? currency(line) : ''}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const cfg = Array.isArray(quote?.quote_financial_configs) ? quote.quote_financial_configs[0] : quote?.quote_financial_configs;
                  const parseMaybe = (v) => {
                    if (!v) return {};
                    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
                    return v;
                  };
                  const vatConf = parseMaybe(cfg?.vat_config);
                  const advConf = parseMaybe(cfg?.advance_config);
                  const vatAmount = vatConf?.display ? (tasksSubtotal * Number(vatConf.rate || 0) / 100) : 0;
                  const totalWithVat = tasksSubtotal + vatAmount;
                  const advanceAmount = advConf?.enabled ? Number(advConf.amount || 0) : 0;
                  const balance = totalWithVat - advanceAmount;
                  return (
                    <>
                      <tr className="bg-gray-100">
                        <td className="p-2 font-semibold" colSpan={4}>SOUS-TOTAL HT</td>
                        <td className="p-2 text-right font-semibold">{currency(tasksSubtotal)}</td>
                      </tr>
                      {vatConf?.display && (
                        <tr className="bg-gray-100">
                          <td className="p-2 font-semibold" colSpan={4}>TVA ({Number(vatConf.rate||0)}%)</td>
                          <td className="p-2 text-right font-semibold">{currency(vatAmount)}</td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td className="p-2 font-semibold" colSpan={4}>TOTAL TTC</td>
                        <td className="p-2 text-right font-semibold">{currency(totalWithVat)}</td>
                      </tr>
                      {advConf?.enabled && (
                        <>
                          <tr className="bg-gray-100">
                            <td className="p-2 font-semibold" colSpan={4}>ACOMPTE À LA COMMANDE</td>
                            <td className="p-2 text-right font-semibold">{currency(advanceAmount)}</td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td className="p-2 font-semibold" colSpan={4}>SOLDE À LA LIVRAISON</td>
                            <td className="p-2 text-right font-semibold">{currency(balance)}</td>
                          </tr>
                        </>
                      )}
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>

        {/* General Conditions and Signatures (simplified) */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="font-semibold mb-2">CONDITIONS GÉNÉRALES</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {(() => {
                  const cfg = Array.isArray(quote?.quote_financial_configs) ? quote.quote_financial_configs[0] : quote?.quote_financial_configs;
                  const parseMaybe = (v) => { if (!v) return {}; if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } } return v; };
                  const defaultConditions = parseMaybe(cfg?.default_conditions)?.text || 'Quote valid for 30 days. Payment term: 30 days.';
                  return defaultConditions;
                })()}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border rounded p-3 text-center">
                <div className="text-xs text-gray-500 mb-2">Signature entreprise</div>
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="mx-auto h-14 object-contain" />
                ) : (
                  <div className="h-14" />
                )}
              </div>
              <div className="border rounded p-3 text-center">
                <div className="text-xs text-gray-500 mb-2">Bon pour accord client</div>
                <div className="h-14" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicQuoteShareViewer;


