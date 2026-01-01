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

  // Helper function to format character date with month name
  const formatCharacterDate = (character: Character): string => {
    if (!character.currentYear || !character.currentDay) {
      return '';
    }
    
    // Calculate month and day from currentDay (1-620)
    const monthNumber = Math.floor((character.currentDay - 1) / 20) + 1;
    const dayInMonth = ((character.currentDay - 1) % 20) + 1;
    const month = CALENDAR_MONTHS.find(m => m.number === monthNumber);
    
    // Format: "3692, Csend 12" (year, month day)
    return `${character.currentYear}, ${month?.name || ''} ${dayInMonth}`;
  };

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
      const errorMessage = err.response?.data?.error || t.characters.failedCreate;
      alert(errorMessage);
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (window.confirm(t.characters.confirmDelete)) {
      try {
        await characterService.deleteCharacter(id);
        loadCharacters();
      } catch (err) {
        alert(t.characters.failedDelete);
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
      alert(t.characters.failedIncrement);
    }
  };

  const handleDecrementDay = async (id: number) => {
    try {
      const updatedCharacter = await characterService.decrementDay(id);
      setCharacters(characters.map(char => 
        char.id === id ? updatedCharacter : char
      ));
    } catch (err) {
      alert(t.characters.failedDecrement);
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
        alert(t.account.failedDelete);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="page-container">
      <div className="flex-row justify-space-between align-center mb-20">
        <div className="flex-row align-center">
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
        <div className="form-border mb-20">
          <h3>{t.account.deleteAccountHeading}</h3>
          <form onSubmit={handleDeleteAccount}>
            <div className="form-group">
              <label className="form-label-block">{t.account.confirmWithPassword}</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                className="form-input-full"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-delete mr-10">
                {t.account.confirmDeleteButton}
              </button>
              <button type="button" onClick={() => setShowDeleteAccount(false)} className="btn-primary">
                {t.characters.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingCharacter && (
        <div className="form-border mb-20">
          <h3>{t.characters.editCharacter}</h3>
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label-block">{t.characters.characterName}:</label>
              <input
                type="text"
                value={editingCharacter.name}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                required
                className="form-input-full"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label-block">{t.characters.pyarrCalendarDate}:</label>
              <div className="grid-3-col">
                <div>
                  <label className="form-help-text">{t.characters.year}:</label>
                  <input
                    type="number"
                    value={editingCharacter.year}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, year: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    className="form-input-full"
                  />
                </div>
                <div>
                  <label className="form-help-text">{t.characters.month}:</label>
                  <select
                    value={editingCharacter.month}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, month: parseInt(e.target.value) })}
                    required
                    className="form-input-full"
                  >
                    {CALENDAR_MONTHS.map(month => (
                      <option key={month.number} value={month.number}>
                        {month.number}. {month.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-help-text">{t.characters.day}:</label>
                  <input
                    type="number"
                    value={editingCharacter.day}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, day: parseInt(e.target.value) || 1 })}
                    required
                    min="1"
                    max="20"
                    className="form-input-full"
                  />
                </div>
              </div>
              <div className="form-help-text mt-5">
                {t.characters.monthHasDays}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary mr-10">
                {t.characters.saveChanges}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn-primary">
                {t.characters.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-container mb-20">
        <h3>{t.characters.addNewCharacter}</h3>
        <form onSubmit={handleCreateCharacter} className="flex-row flex-gap-10">
          <input
            type="text"
            value={newCharacterName}
            onChange={(e) => setNewCharacterName(e.target.value)}
            placeholder={t.characters.characterNamePlaceholder}
            required
            className="form-input-medium"
          />
          <button type="submit" className="btn-primary">
            {t.characters.addCharacter}
          </button>
        </form>
      </div>

      <div>
        <h3>{t.characters.characterList}</h3>
        {characters.length === 0 ? (
          <p>{t.characters.noCharacters}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-cell">{t.characters.name}</th>
                <th className="table-cell">{t.characters.currentDate}</th>
                <th className="table-cell-center">{t.characters.dateControls}</th>
                <th className="table-cell-center">{t.characters.actions}</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id}>
                  <td className="table-cell">{character.name}</td>
                  <td className="table-cell">
                    {formatCharacterDate(character) || `${t.characters.yearLabel} ${character.currentYear}, ${t.characters.dayLabel} ${character.currentDay}`}
                  </td>
                  <td className="table-cell-center">
                    <button
                      onClick={() => handleDecrementDay(character.id)}
                      className="btn-quantity mr-5"
                      title={t.characters.previousDay}
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleIncrementDay(character.id)}
                      className="btn-quantity"
                      title={t.characters.nextDay}
                    >
                      +
                    </button>
                  </td>
                  <td className="table-cell-center">
                    <button
                      onClick={() => navigate(`/characters/${character.id}/inventory`)}
                      className="btn-small mr-5"
                    >
                      {t.characters.viewInventory}
                    </button>
                    <button
                      onClick={() => handleEditCharacter(character)}
                      className="btn-small mr-5"
                    >
                      {t.characters.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(character.id)}
                      className="btn-delete"
                    >
                      {t.characters.delete}
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
