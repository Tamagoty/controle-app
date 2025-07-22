// src/components/FileUploader/FileUploader.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import imageCompression from 'browser-image-compression';
import styles from './FileUploader.module.css';
import { FaFileUpload, FaTrash, FaSpinner, FaFilePdf, FaFileImage, FaEye } from 'react-icons/fa';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import AttachmentViewer from '../AttachmentViewer/AttachmentViewer'; // <-- NOVO

const MAX_INITIAL_FILE_SIZE_MB = 10;

const FileUploader = ({ recordId, recordType }) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false); // <-- NOVO
  const [fileToView, setFileToView] = useState(null);       // <-- NOVO
  const { user, profile } = useAuth();
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

    if (file.size > MAX_INITIAL_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`O ficheiro é demasiado grande. O máximo permitido é ${MAX_INITIAL_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      let fileToUpload = file;
      
      if (file.type.startsWith('image/')) {
        const { image_quality, max_size_mb, max_width_or_height } = profile.media_settings;
        
        const options = {
          maxSizeMB: max_size_mb,
          maxWidthOrHeight: max_width_or_height,
          useWebWorker: true,
          initialQuality: image_quality
        };
        
        notify.info('A comprimir a imagem...');
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
      
      // Abre o modal em vez de uma nova janela
      setFileToView({
        url: data.signedUrl,
        name: getFileName(filePath)
      });
      setIsViewerOpen(true);

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
              <div className={styles.fileInfo}>
                {file.file_path.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />}
                <span>{getFileName(file.file_path)}</span>
              </div>
              <div className={styles.fileActions}>
                <Button icon={FaEye} variant="ghost" isIconOnly onClick={() => handleViewFile(file.file_path)}>Ver</Button>
                <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDelete(file.file_path)}>Apagar</Button>
              </div>
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

      {/* NOVO MODAL DE VISUALIZAÇÃO */}
      <AttachmentViewer 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        fileUrl={fileToView?.url}
        fileName={fileToView?.name}
      />
    </div>
  );
};

export default FileUploader;
