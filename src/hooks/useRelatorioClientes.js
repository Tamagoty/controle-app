// src/hooks/useRelatorioClientes.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para buscar os dados do relatório de clientes.
 * @returns {{reportData: Array, loading: boolean, fetchReport: (dates: {start: string, end: string}) => Promise<void>}}
 */
export const useRelatorioClientes = (initialDates) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchReport = useCallback(async (dates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_client_sales_report', {
        p_start_date: dates.start,
        p_end_date: dates.end,
      });
      if (error) throw error;
      setReportData(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível gerar o relatório de clientes.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchReport(initialDates);
  }, [fetchReport, initialDates]);

  return { reportData, loading, fetchReport };
};
