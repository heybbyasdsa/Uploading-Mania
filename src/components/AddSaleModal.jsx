import React from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddSaleModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = React.useState({
        customer: '',
        product: '',
        amount: '',
        status: 'Paid',
        notes: '',
        staff: 'ST-204'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingId: 'manual',
                    saleDetails: {
                        customer: formData.customer,
                        product: formData.product,
                        amount: parseFloat(formData.amount),
                        status: formData.status,
                        staff: formData.staff,
                        notes: formData.notes
                    }
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
                setFormData({
                    customer: '',
                    product: '',
                    amount: '',
                    status: 'Paid',
                    notes: '',
                    staff: 'ST-204'
                });
            }
        } catch (error) {
            console.error("Failed to add sale:", error);
        }
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="modal-content card"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div>
                            <h3>Add New Sale</h3>
                            <p className="text-secondary text-sm">Fill in the details for the new transaction</p>
                        </div>
                        <button className="btn-icon" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form className="modal-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Customer Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    required
                                    value={formData.customer}
                                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Product / Service</label>
                                <select
                                    required
                                    value={formData.product}
                                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                >
                                    <option value="">Select product...</option>
                                    <option>Diamond Bundle</option>
                                    <option>Gold Subscription</option>
                                    <option>Premium Support</option>
                                    <option>Custom Development</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount (USD)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Payment Status</label>
                                <div className="status-toggle-group">
                                    <label className="status-radio">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Paid"
                                            checked={formData.status === 'Paid'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                        <span className="status-pill paid">Paid</span>
                                    </label>
                                    <label className="status-radio">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Pending"
                                            checked={formData.status === 'Pending'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                        <span className="status-pill pending">Pending</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Additional Notes</label>
                            <textarea
                                placeholder="Any specific details about this sale..."
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="form-info">
                            <AlertCircle size={16} />
                            <span>This entry will be recorded under your staff ID: <b>{formData.staff}</b></span>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary">
                                <Save size={18} />
                                <span>Record Sale</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddSaleModal;
