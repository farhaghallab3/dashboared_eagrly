import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdCheckCircle, MdDelete, MdEmail, MdPending, MdSearch } from 'react-icons/md';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import { getContactMessages, updateContactMessage, deleteContactMessage } from '../services/apiClient';

interface ContactMessage {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    is_resolved: boolean;
}

const ContactMessages: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filter !== 'all') {
                params.is_resolved = filter === 'resolved' ? 'true' : 'false';
            }
            const data = await getContactMessages(params);

            if (Array.isArray(data)) {
                setMessages(data);
            } else if (data.results && Array.isArray(data.results)) {
                setMessages(data.results);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [filter]);

    const handleResolve = async (id: number) => {
        try {
            await updateContactMessage(id, { is_resolved: true });
            toast.success('Message resolved');
            fetchMessages();
        } catch (error) {
            console.error('Failed to resolve message', error);
            toast.error('Failed to resolve message');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await deleteContactMessage(id);
            toast.success('Message deleted');
            fetchMessages();
        } catch (error) {
            console.error('Failed to delete message', error);
            toast.error('Failed to delete message');
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Contact Messages</h1>
                    <p className="text-sm opacity-70 mt-1" style={{ color: 'var(--text-secondary)' }}>Manage inquiries from the contact form</p>
                </div>

                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-color)]">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'pending' ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'resolved' ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}
                    >
                        Resolved
                    </button>
                </div>
            </div>

            <div className="mb-6 relative max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--text-secondary)' }}><MdSearch /></span>
                <input
                    type="text"
                    placeholder="Search items by subject, email, or name..."
                    className="w-full rounded-lg pl-10 pr-4 py-2.5 transition"
                    style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>Loading messages...</div>
            ) : (
                <Table<ContactMessage>
                    data={filteredMessages}
                    columns={[
                        {
                            header: 'Status',
                            accessor: (msg) => msg.is_resolved ? (
                                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-2 py-1 rounded-full w-fit text-xs font-semibold">
                                    <MdCheckCircle /> Resolved
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full w-fit text-xs font-semibold">
                                    <MdPending /> Pending
                                </div>
                            )
                        },
                        { header: 'Subject', accessor: 'subject', className: 'font-medium' },
                        {
                            header: 'From',
                            accessor: (msg) => (
                                <div>
                                    <div className="font-medium">{msg.first_name} {msg.last_name}</div>
                                    <div className="text-xs opacity-70">{msg.email}</div>
                                </div>
                            )
                        },
                        { header: 'Date', accessor: (msg) => new Date(msg.created_at).toLocaleDateString() },
                        {
                            header: 'Message',
                            accessor: (msg) => (
                                <span className="text-sm opacity-80 line-clamp-1 max-w-xs" title={msg.message}>
                                    {msg.message}
                                </span>
                            )
                        }
                    ]}
                    actions={(msg) => (
                        <div className="flex justify-center gap-2">
                            {!msg.is_resolved && (
                                <button
                                    onClick={() => handleResolve(msg.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-green-400 transition"
                                    title="Mark as Resolved"
                                >
                                    <MdCheckCircle size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(msg.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition"
                                title="Delete"
                            >
                                <MdDelete size={18} />
                            </button>
                        </div>
                    )}
                />
            )}
        </Layout>
    );
};

export default ContactMessages;
