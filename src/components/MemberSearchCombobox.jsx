import React, { useState, useRef, useEffect } from 'react';
import { Search, User, X, Loader } from 'lucide-react';

/**
 * Searchable Member Combobox
 * Replaces dropdown with async search functionality
 */
const MemberSearchCombobox = ({ 
    members = [], 
    value, 
    onChange, 
    loading = false,
    placeholder = "Search member by name or ID...",
    error = null
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMembers, setFilteredMembers] = useState(members);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const safeMembers = Array.isArray(members) ? members : [];
    const selectedMember = safeMembers.find(m => m.MemberID === value);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = safeMembers.filter(m => 
            m.FullName.toLowerCase().includes(query) || 
            m.MemberID.toLowerCase().includes(query)
        );
        setFilteredMembers(filtered);
    }, [searchQuery, safeMembers]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (member) => {
        onChange(member.MemberID);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = () => {
        onChange('');
        setSearchQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="member-combobox" ref={dropdownRef}>
            <div className={`combobox-input-wrapper ${error ? 'error' : ''} ${isOpen ? 'open' : ''}`}>
                <Search className="combobox-icon" size={18} />
                
                {selectedMember && !isOpen ? (
                    <div className="selected-member" onClick={() => setIsOpen(true)}>
                        <User size={16} className="member-avatar-icon" />
                        <span className="member-name">{selectedMember.FullName}</span>
                        <span className="member-id">({selectedMember.MemberID})</span>
                        <button 
                            type="button"
                            className="clear-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder}
                        className="combobox-input"
                    />
                )}

                {loading && <Loader className="combobox-loader" size={16} />}
            </div>

            {error && (
                <div className="combobox-error">
                    {error}
                </div>
            )}

            {isOpen && (
                <div className="combobox-dropdown">
                    {filteredMembers.length > 0 ? (
                        <>
                            <button
                                type="button"
                                className="combobox-option guest"
                                onClick={() => handleSelect({ MemberID: 'guest', FullName: 'Guest / Anonymous' })}
                            >
                                <User size={16} />
                                <span>Guest / Anonymous</span>
                            </button>
                            <div className="combobox-divider" />
                            {filteredMembers.map((member) => (
                                <button
                                    key={member.MemberID}
                                    type="button"
                                    className="combobox-option"
                                    onClick={() => handleSelect(member)}
                                >
                                    <User size={16} />
                                    <span className="option-name">{member.FullName}</span>
                                    <span className="option-id">{member.MemberID}</span>
                                </button>
                            ))}
                        </>
                    ) : (
                        <div className="combobox-empty">
                            No members found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberSearchCombobox;
