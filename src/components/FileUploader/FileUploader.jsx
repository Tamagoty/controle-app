// src/components/FileUploader/FileUploader.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import imageCompression from 'browser-image-compression';
import styles from './FileUploader.module.css';
import { FaFileUpload, FaTrash, FaSpinner, FaFilePdf, FaFileImage, FaExternalLinkAlt } from 'react-icons/fa';
import Button from '../Button/Button';
import Modal from '../Modal/Modal'; // Importar o Modal

const MAX_FILE_SIZE_MB = 5;

const FileUploader = ({ recordId, recordType }) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const { user } = useAuth();
  const notify = useNotify();

  const fetchAttachments = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('id, file_path')
        .eq(`${recordType}_id`, recordId);
      if (error) throw error;
      setAttachments(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar os anexos.');
    } finally {
      setLoading(false);
    }
  }, [recordId, recordType, notify]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`O ficheiro é demasiado grande. O máximo é ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.6
        };
        fileToUpload = await imageCompression(file, options);
      }

      const filePath = `${user.id}/${recordId}/${Date.now()}_${fileToUpload.name}`;

      await supabase.storage.from('attachments').upload(filePath, fileToUpload);
      await supabase.from('attachments').insert({
        file_path: filePath,
        [`${recordType}_id`]: recordId,
        uploaded_by: user.id,
      });

      notify.success('Ficheiro carregado com sucesso!');
      fetchAttachments();
    } catch (err) {
      notify.error(err.message || 'Falha ao carregar o ficheiro.');
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .createSignedUrl(filePath, 300);
      
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      notify.error(err.message || 'Não foi possível obter o link do ficheiro.');
    }
  };

  const handleDelete = (filePath) => {
    setFileToDelete(filePath);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await supabase.from('attachments').delete().eq('file_path', fileToDelete);
      await supabase.storage.from('attachments').remove([fileToDelete]);
      notify.success('Anexo apagado com sucesso!');
      fetchAttachments();
    } catch (err) {
      notify.error(err.message || 'Falha ao apagar o anexo.');
    } finally {
      setIsConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const getFileName = (path) => path.split('/').pop().substring(14);

  return (
    <div className={styles.container}>
      <h4>Anexos</h4>
      <div className={styles.uploadArea}>
        <label htmlFor={`file-upload-${recordId}`} className={styles.uploadLabel}>
          {uploading ? <FaSpinner className={styles.spinner} /> : <FaFileUpload />}
          <span>{uploading ? 'A carregar...' : 'Escolher Ficheiro (PDF ou Imagem)'}</span>
        </label>
        <input
          id={`file-upload-${recordId}`}
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      {loading && <p>A carregar anexos...</p>}
      
      {!loading && attachments.length > 0 && (
        <ul className={styles.fileList}>
          {attachments.map(file => (
            <li key={file.id}>
              <a onClick={() => handleViewFile(file.file_path)} className={styles.fileInfo} title="Ver ficheiro">
                {file.file_path.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />}
                <span>{getFileName(file.file_path)}</span>
                <FaExternalLinkAlt className={styles.externalLinkIcon} />
              </a>
              <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDelete(file.file_path)}>Apagar</Button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar este anexo? Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Apagar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FileUploader;
