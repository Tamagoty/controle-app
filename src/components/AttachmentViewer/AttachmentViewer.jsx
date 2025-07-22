// src/components/AttachmentViewer/AttachmentViewer.jsx

import React from 'react';
import Modal from '../Modal/Modal';
import styles from './AttachmentViewer.module.css';
import { FaDownload } from 'react-icons/fa';
import Button from '../Button/Button';

const AttachmentViewer = ({ isOpen, onClose, fileUrl, fileName }) => {
  if (!isOpen || !fileUrl) {
    return null;
  }

  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    // Usa a nova prop 'size' para tornar o modal maior
    <Modal isOpen={isOpen} onClose={onClose} title={fileName} size="xl">
      <div className={styles.viewerContainer}>
        <div className={styles.viewerHeader}>
            <Button 
                icon={FaDownload}
                onClick={() => window.open(fileUrl, '_blank')}
            >
                Download
            </Button>
        </div>
        <div className={styles.content}>
          {isPdf ? (
            <iframe
              src={fileUrl}
              className={styles.fileFrame}
              title={fileName}
              frameBorder="0"
            />
          ) : (
            <img
              src={fileUrl}
              alt={fileName}
              className={styles.image}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AttachmentViewer;
