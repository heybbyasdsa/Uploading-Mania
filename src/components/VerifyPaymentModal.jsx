import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Lock, User, Hash, Tag, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VerifyPaymentModal = ({ isOpen, onClose, payment, onSuccess }) => {
    const [formData, setFormData] = useState({
        customer: '',
        discordId: '',
        product: '',
        amount: '',
        txnId: '',
        staff: 'Admin'
    });

    useEffect(() => {
        if (payment) {
            // Extract numeric amount from "₹500.00"
            const numericAmount = payment.amount ? parseFloat(payment.amount.replace('₹', '').replace(',', '')) : 0;

            setFormData(prev => ({
                ...prev,
                customer: payment.party || '',
                amount: numericAmount,
                txnId: payment.txn_id || ''
            }));
        }
    }, [payment]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingId: payment._id,
                    saleDetails: {
                        customer: formData.customer,
                        discordId: formData.discordId,
                        product: formData.product,
                        amount: formData.amount,
                        txnId: formData.txnId,
                        staff: formData.staff
                    }
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Verification failed:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="modal-content card verify-modal"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div>
                            <h3>Verify Bot Payment</h3>
                            <p className="text-secondary text-sm">Review and assign product to this transaction</p>
                        </div>
                        <button className="btn-icon" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form className="modal-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group locked">
                                <label><DollarSign size={14} /> Amount (Auto-filled)</label>
                                <div className="input-with-icon">
                                    <input type="text" value={payment.amount} readOnly />
                                    <Lock size={16} className="lock-icon" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label><Tag size={14} /> Product</label>
                                <select
                                    required
                                    value={formData.product}
                                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                >
                                    <option value="">Select product...</option>
                                    <option>Diamond Bundle</option>
                                    <option>Gold Subscription</option>
                                    <option>Premium Support</option>
                                    <option>Basic Entry</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label><User size={14} /> Customer Name</label>
                                <input
                                    type="text"
                                    value={formData.customer}
                                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label><Hash size={14} /> Discord ID / Username</label>
                                <input
                                    type="text"
                                    placeholder="e.g. user#1234 or 12345678"
                                    value={formData.discordId}
                                    onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                                />
                            </div>

                            <div className="form-group full-width locked">
                                <label><Hash size={14} /> Transaction ID</label>
                                <div className="input-with-icon">
                                    <input type="text" value={formData.txnId} readOnly />
                                    <Lock size={16} className="lock-icon" />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Discard</button>
                            <button type="submit" className="btn-success">
                                <CheckCircle2 size={18} />
                                <span>Verify & Add to Sales</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VerifyPaymentModal;
