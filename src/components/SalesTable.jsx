import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const SalesTable = ({ sales }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter logic
    const filteredSales = sales.filter(sale =>
        sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.includes(searchTerm) ||
        sale.txnId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="sales-container">
            <div className="section-header">
                <div className="header-left">
                    <h2>Sales Records</h2>
                    <p>Manage and track all your business transactions</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, Customer, Product..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>
                    <button className="btn-secondary">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="btn-secondary">
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="table-wrapper card">
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date & Time</th>
                            <th>Staff</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSales.length > 0 ? (
                            paginatedSales.map((sale) => (
                                <tr key={sale._id || sale.id}>
                                    <td><span className="sale-id">#{sale.id}</span></td>
                                    <td>
                                        <div className="customer-info">
                                            <div className="customer-avatar">{sale.customer[0]}</div>
                                            <span>{sale.customer}</span>
                                        </div>
                                    </td>
                                    <td>{sale.product}</td>
                                    <td className="font-mono">${sale.amount.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge badge-${sale.status.toLowerCase()}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="date-time">
                                            <span>{sale.date}</span>
                                            <span className="text-muted">{sale.time}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="staff-tag">{sale.staff}</div>
                                    </td>
                                    <td>
                                        <button className="btn-icon">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No records found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="table-footer">
                    <p>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSales.length)} of {filteredSales.length} results</p>
                    <div className="pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="page-nav"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                className={currentPage === i + 1 ? 'active' : ''}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="page-nav"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesTable;
