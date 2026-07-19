import { motion } from 'framer-motion'
import StoreModal, { ModalClose } from './StoreModal'
import { CREDIT_EARN_ACTIONS } from '@/lib/creditActions'

// Modal "Cómo conseguir créditos". Las 13 acciones salen de la constante
// compartida (misma tabla real de award-points que usa el perfil).

export default function EarnModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <StoreModal open={open} onClose={onClose} labelledBy="earn-title">
      <ModalClose onClose={onClose} />
      <div className="m-body" style={{ paddingTop: 28 }}>
        <h3 id="earn-title">⚡ Cómo conseguir créditos</h3>
        <p className="m-desc">Cada acción en Travexa Academy suma. Los créditos se acreditan al instante y vencen al año.</p>
        <div className="earn-list">
          {CREDIT_EARN_ACTIONS.map((a, i) => (
            <motion.div
              key={a.label}
              className="earn-item"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.045, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="earn-ico">{a.icon}</div>
              <div className="t">{a.label}<small>{a.sub}</small></div>
              <div className="earn-pts">+{a.creditos}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </StoreModal>
  )
}
