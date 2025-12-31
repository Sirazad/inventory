import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterService, authService } from '../services/api';
import { Character } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

// Pyarr calendar months (31 months)
const CALENDAR_MONTHS = [
  { number: 1, name: 'Szándék' }, { number: 2, name: 'Akarat' }, { number: 3, name: 'Harag' },
  { number: 4, name: 'Végítélet' }, { number: 5, name: 'Sikolyok' }, { number: 6, name: 'Csend' },
  { number: 7, name: 'Kacaj' }, { number: 8, name: 'Pengék' }, { number: 9, name: 'Csontok' },
  { number: 10, name: 'Hamvak' }, { number: 11, name: 'Lant' }, { number: 12, name: 'Álmok' },
  { number: 13, name: 'Ébredés' }, { number: 14, name: 'Áldozat' }, { number: 15, name: 'Engesztelés' },
  { number: 16, name: 'Lángok' }, { number: 17, name: 'Feloldozás' }, { number: 18, name: 'Ifjak' },
  { number: 19, name: 'Bölcsek' }, { number: 20, name: 'Beavatottak' }, { number: 21, name: 'Felemelkedők' },
  { number: 22, name: 'Fogadalmak' }, { number: 23, name: 'Esküvések' }, { number: 24, name: 'Fohászok' },
  { number: 25, name: 'Hullámok' }, { number: 26, name: 'Áradás' }, { number: 27, name: 'Tengercsend' },
  { number: 28, name: 'Zivatar' }, { number: 29, name: 'Kék Acél' }, { number: 30, name: 'Sólyomszárny' },
  { number: 31, name: 'Holdak és vándorok' }
];

interface EditingCharacter {
  id: number;
  name: string;
  year: number;
  month: number;
  day: number;
}

const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<EditingCharacter | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const data = await characterService.getCharacters();
      setCharacters(data);
    } catch (err) {
      console.error('Failed to load characters', err);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await characterService.createCharacter(newCharacterName);
      setNewCharacterName('');
      loadCharacters();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create character';
      alert(errorMessage);
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (window.confirm(t.characters.confirmDelete)) {
      try {
        await characterService.deleteCharacter(id);
        loadCharacters();
      } catch (err) {
        alert('Failed to delete character');
      }
    }
  };

  const handleIncrementDay = async (id: number) => {
    try {
      const updatedCharacter = await characterService.incrementDay(id);
      setCharacters(characters.map(char => 
        char.id === id ? updatedCharacter : char
      ));
    } catch (err) {
      alert('Failed to increment day');
    }
  };

  const handleDecrementDay = async (id: number) => {
    try {
      const updatedCharacter = await characterService.decrementDay(id);
      setCharacters(characters.map(char => 
        char.id === id ? updatedCharacter : char
      ));
    } catch (err) {
      alert('Failed to decrement day');
    }
  };

  const handleEditCharacter = (character: Character) => {
    // Calculate month and day from currentDay
    const monthNumber = Math.floor((character.currentDay - 1) / 20) + 1;
    const dayInMonth = ((character.currentDay - 1) % 20) + 1;
    
    setEditingCharacter({
      id: character.id,
      name: character.name,
      year: character.currentYear,
      month: monthNumber,
      day: dayInMonth
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharacter) return;

    try {
      // Convert month and day to day-of-year (1-620)
      const dayOfYear = (editingCharacter.month - 1) * 20 + editingCharacter.day;
      
      const updatedCharacter = await characterService.updateCharacter(
        editingCharacter.id,
        editingCharacter.name,
        editingCharacter.year,
        dayOfYear
      );
      
      setCharacters(characters.map(char => 
        char.id === editingCharacter.id ? updatedCharacter : char
      ));
      setEditingCharacter(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update character';
      alert(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingCharacter(null);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm(t.account.confirmDelete)) {
      try {
        await authService.deleteAccount(deletePassword);
        localStorage.clear();
        navigate('/login');
      } catch (err) {
        alert('Failed to delete account. Please check your password.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>{t.characters.title}</h1>
          <LanguageToggle />
        </div>
        <div>
          <button 
            onClick={() => navigate('/categories')} 
            className="btn-primary mr-10"
          >
            {t.characters.manageCategories}
          </button>
          <button onClick={handleLogout} className="btn-primary mr-10">
            {t.nav.logout}
          </button>
          <button 
            onClick={() => setShowDeleteAccount(!showDeleteAccount)} 
            className="btn-primary"
          >
            {t.account.deleteAccount}
          </button>
        </div>
      </div>

      {showDeleteAccount && (
        <div style={{ padding: '15px', border: '2px solid #7AB8C0', marginBottom: '20px', backgroundColor: 'white' }}>
          <h3>Delete Account</h3>
          <form onSubmit={handleDeleteAccount}>
            <div style={{ marginBottom: '10px' }}>
              <label>Confirm with password:</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <button type="submit" className="btn-delete mr-10">
              Confirm Delete
            </button>
            <button type="button" onClick={() => setShowDeleteAccount(false)} style={{ padding: '10px 20px' }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {editingCharacter && (
        <div style={{ padding: '20px', border: '2px solid #7AB8C0', marginBottom: '20px', backgroundColor: 'white' }}>
          <h3>Edit Character</h3>
          <form onSubmit={handleSaveEdit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Character Name:</label>
              <input
                type="text"
                value={editingCharacter.name}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pyarr Calendar Date:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>Year:</label>
                  <input
                    type="number"
                    value={editingCharacter.year}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, year: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>Month:</label>
                  <select
                    value={editingCharacter.month}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, month: parseInt(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  >
                    {CALENDAR_MONTHS.map(month => (
                      <option key={month.number} value={month.number}>
                        {month.number}. {month.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>Day:</label>
                  <input
                    type="number"
                    value={editingCharacter.day}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, day: parseInt(e.target.value) || 1 })}
                    required
                    min="1"
                    max="20"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Each month has 20 days (Day 1-20)
              </div>
            </div>

            <button type="submit" className="btn-primary mr-10">
              Save Changes
            </button>
            <button type="button" onClick={handleCancelEdit} style={{ padding: '10px 20px' }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Add New Character</h3>
        <form onSubmit={handleCreateCharacter}>
          <input
            type="text"
            value={newCharacterName}
            onChange={(e) => setNewCharacterName(e.target.value)}
            placeholder="Character name"
            required
            style={{ padding: '8px', marginRight: '10px', width: '300px' }}
          />
          <button type="submit" style={{ padding: '8px 20px' }}>
            Add Character
          </button>
        </form>
      </div>

      <div>
        <h3>Character List</h3>
        {characters.length === 0 ? (
          <p>No characters yet. Create your first character above!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Current Date</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Date Controls</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{character.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '14px' }}>
                    {character.formattedDate || `Year ${character.currentYear}, Day ${character.currentDay}`}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDecrementDay(character.id)}
                      className="btn-quantity mr-5"
                      title="Previous day"
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleIncrementDay(character.id)}
                      className="btn-quantity"
                      title="Next day"
                    >
                      +
                    </button>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/characters/${character.id}/inventory`)}
                      className="btn-small mr-5"
                    >
                      View Inventory
                    </button>
                    <button
                      onClick={() => handleEditCharacter(character)}
                      className="btn-small mr-5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(character.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Characters;
