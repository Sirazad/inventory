import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterService, authService } from '../services/api';
import { Character } from '../types';

const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const navigate = useNavigate();

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
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        await characterService.deleteCharacter(id);
        loadCharacters();
      } catch (err) {
        alert('Failed to delete character');
      }
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
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
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Characters</h2>
        <div>
          <button 
            onClick={() => navigate('/categories')} 
            style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#007bff', color: 'white' }}
          >
            Manage Categories
          </button>
          <button onClick={handleLogout} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Logout
          </button>
          <button 
            onClick={() => setShowDeleteAccount(!showDeleteAccount)} 
            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white' }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteAccount && (
        <div style={{ padding: '15px', border: '2px solid #dc3545', marginBottom: '20px', backgroundColor: '#ffe6e6' }}>
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
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', marginRight: '10px' }}>
              Confirm Delete
            </button>
            <button type="button" onClick={() => setShowDeleteAccount(false)} style={{ padding: '10px 20px' }}>
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
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Created</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{character.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {new Date(character.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/characters/${character.id}/inventory`)}
                      style={{ padding: '5px 15px', marginRight: '5px' }}
                    >
                      View Inventory
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(character.id)}
                      style={{ padding: '5px 15px', backgroundColor: '#dc3545', color: 'white' }}
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
