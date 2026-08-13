import React, { useState, useEffect } from 'react';
import { pincodeService } from '@shared/services';
import { Card, Button, LoadingSpinner } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { getErrorMessage } from '@shared/utils';

function LocationManagement() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('states'); // 'states', 'cities', 'pincodes'
  const [loading, setLoading] = useState(false);
  
  // States
  const [states, setStates] = useState([]);
  const [stateForm, setStateForm] = useState({ code: '', name: '', active: true });
  const [editingState, setEditingState] = useState(null);
  const [showStateForm, setShowStateForm] = useState(false);
  
  // Cities
  const [cities, setCities] = useState([]);
  const [cityForm, setCityForm] = useState({ name: '', stateId: '', active: true });
  const [editingCity, setEditingCity] = useState(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [selectedStateForCities, setSelectedStateForCities] = useState(null);
  
  // Pincodes
  const [pincodes, setPincodes] = useState([]);
  const [pincodeForm, setPincodeForm] = useState({ code: '', cityId: '', serviceable: true, active: true });
  const [editingPincode, setEditingPincode] = useState(null);
  const [showPincodeForm, setShowPincodeForm] = useState(false);
  const [selectedCityForPincodes, setSelectedCityForPincodes] = useState(null);
  const [pincodeFilter, setPincodeFilter] = useState({ cityId: null, serviceable: null });

  useEffect(() => {
    if (activeTab === 'states') {
      loadStates();
    } else if (activeTab === 'cities') {
      loadStates(); // Need states for city form
      if (selectedStateForCities) {
        loadCities(selectedStateForCities);
      } else {
        loadCities();
      }
    } else if (activeTab === 'pincodes') {
      loadStates();
      loadCities();
      loadPincodes();
    }
  }, [activeTab, selectedStateForCities, selectedCityForPincodes, pincodeFilter]);

  const loadStates = async () => {
    try {
      setLoading(true);
      const data = await pincodeService.getAllStates();
      setStates(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load states'));
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (stateId = null) => {
    try {
      setLoading(true);
      const data = await pincodeService.getAllCities(stateId);
      setCities(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load cities'));
    } finally {
      setLoading(false);
    }
  };

  const loadPincodes = async () => {
    try {
      setLoading(true);
      const data = await pincodeService.getAllPincodes(
        pincodeFilter.cityId || null,
        pincodeFilter.serviceable !== null ? pincodeFilter.serviceable : null
      );
      setPincodes(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load pincodes'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateState = () => {
    setEditingState(null);
    setStateForm({ code: '', name: '', active: true });
    setShowStateForm(true);
  };

  const handleEditState = (state) => {
    setEditingState(state);
    setStateForm({ code: state.code, name: state.name, active: state.active });
    setShowStateForm(true);
  };

  const handleSubmitState = async (e) => {
    e.preventDefault();
    try {
      if (editingState) {
        await pincodeService.updateState(editingState.id, stateForm);
        toast.success('State updated successfully');
      } else {
        await pincodeService.createState(stateForm);
        toast.success('State created successfully');
      }
      setShowStateForm(false);
      loadStates();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save state'));
    }
  };

  const handleCreateCity = () => {
    setEditingCity(null);
    setCityForm({ name: '', stateId: selectedStateForCities?.toString() || '', active: true });
    setShowCityForm(true);
  };

  const handleEditCity = (city) => {
    setEditingCity(city);
    setCityForm({ name: city.name, stateId: city.state?.id?.toString() || '', active: city.active });
    setShowCityForm(true);
  };

  const handleSubmitCity = async (e) => {
    e.preventDefault();
    try {
      const cityData = {
        name: cityForm.name,
        state: { id: parseInt(cityForm.stateId) },
        active: cityForm.active
      };
      if (editingCity) {
        await pincodeService.updateCity(editingCity.id, cityData);
        toast.success('City updated successfully');
      } else {
        await pincodeService.createCity(cityData);
        toast.success('City created successfully');
      }
      setShowCityForm(false);
      loadCities(selectedStateForCities);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save city'));
    }
  };

  const handleCreatePincode = () => {
    setEditingPincode(null);
    setPincodeForm({ code: '', cityId: selectedCityForPincodes?.toString() || '', serviceable: true, active: true });
    setShowPincodeForm(true);
  };

  const handleEditPincode = (pincode) => {
    setEditingPincode(pincode);
    setPincodeForm({
      code: pincode.pincode,
      cityId: pincode.cityId?.toString() || '',
      serviceable: pincode.serviceable,
      active: true
    });
    setShowPincodeForm(true);
  };

  const handleSubmitPincode = async (e) => {
    e.preventDefault();
    try {
      const pincodeData = {
        code: pincodeForm.code,
        city: { id: parseInt(pincodeForm.cityId) },
        serviceable: pincodeForm.serviceable,
        active: pincodeForm.active
      };
      if (editingPincode) {
        await pincodeService.updatePincode(editingPincode.id, pincodeData);
        toast.success('Pincode updated successfully');
      } else {
        await pincodeService.createPincode(pincodeData);
        toast.success('Pincode created successfully');
      }
      setShowPincodeForm(false);
      loadPincodes();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save pincode'));
    }
  };

  const handleMarkCityServiceable = async (cityId) => {
    if (!window.confirm('Mark all pincodes in this city as serviceable?')) return;
    try {
      await pincodeService.markCityServiceable(cityId);
      toast.success('All pincodes in city marked as serviceable');
      loadPincodes();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark city as serviceable'));
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <h1>Location Management</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('states')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'states' ? '#007bff' : 'transparent',
            color: activeTab === 'states' ? 'white' : '#666',
            cursor: 'pointer',
            borderBottom: activeTab === 'states' ? '3px solid #007bff' : '3px solid transparent',
            fontWeight: activeTab === 'states' ? '600' : '400'
          }}
        >
          States
        </button>
        <button
          onClick={() => setActiveTab('cities')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'cities' ? '#007bff' : 'transparent',
            color: activeTab === 'cities' ? 'white' : '#666',
            cursor: 'pointer',
            borderBottom: activeTab === 'cities' ? '3px solid #007bff' : '3px solid transparent',
            fontWeight: activeTab === 'cities' ? '600' : '400'
          }}
        >
          Cities
        </button>
        <button
          onClick={() => setActiveTab('pincodes')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'pincodes' ? '#007bff' : 'transparent',
            color: activeTab === 'pincodes' ? 'white' : '#666',
            cursor: 'pointer',
            borderBottom: activeTab === 'pincodes' ? '3px solid #007bff' : '3px solid transparent',
            fontWeight: activeTab === 'pincodes' ? '600' : '400'
          }}
        >
          Pincodes
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {/* States Tab */}
      {activeTab === 'states' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>States</h2>
            <Button onClick={handleCreateState}>+ Add State</Button>
          </div>

          {showStateForm && (
            <Card style={{ marginBottom: '20px', padding: '20px' }}>
              <h3>{editingState ? 'Edit State' : 'Create State'}</h3>
              <form onSubmit={handleSubmitState}>
                <div style={{ marginBottom: '15px' }}>
                  <label>State Code *</label>
                  <input
                    type="text"
                    value={stateForm.code}
                    onChange={(e) => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
                    required
                    maxLength={10}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>State Name *</label>
                  <input
                    type="text"
                    value={stateForm.name}
                    onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={stateForm.active}
                      onChange={(e) => setStateForm({ ...stateForm, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="submit">{editingState ? 'Update' : 'Create'}</Button>
                  <Button type="button" onClick={() => setShowStateForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {states.map((state) => (
              <Card key={state.id} style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{state.name} ({state.code})</h3>
                    <span style={{ color: state.active ? '#28a745' : '#dc3545' }}>
                      {state.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Button onClick={() => handleEditState(state)}>Edit</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cities Tab */}
      {activeTab === 'cities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>Cities</h2>
            <Button onClick={handleCreateCity}>+ Add City</Button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Filter by State:</label>
            <select
              value={selectedStateForCities?.toString() || ''}
              onChange={(e) => setSelectedStateForCities(e.target.value ? parseInt(e.target.value) : null)}
              style={{ padding: '8px', marginLeft: '10px' }}
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {showCityForm && (
            <Card style={{ marginBottom: '20px', padding: '20px' }}>
              <h3>{editingCity ? 'Edit City' : 'Create City'}</h3>
              <form onSubmit={handleSubmitCity}>
                <div style={{ marginBottom: '15px' }}>
                  <label>City Name *</label>
                  <input
                    type="text"
                    value={cityForm.name}
                    onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>State *</label>
                  <select
                    value={cityForm.stateId}
                    onChange={(e) => setCityForm({ ...cityForm, stateId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={cityForm.active}
                      onChange={(e) => setCityForm({ ...cityForm, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="submit">{editingCity ? 'Update' : 'Create'}</Button>
                  <Button type="button" onClick={() => setShowCityForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {cities.map((city) => (
              <Card key={city.id} style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{city.name}</h3>
                    <p>{city.state?.name || 'Unknown State'}</p>
                    <span style={{ color: city.active ? '#28a745' : '#dc3545' }}>
                      {city.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Button onClick={() => handleEditCity(city)}>Edit</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pincodes Tab */}
      {activeTab === 'pincodes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>Pincodes</h2>
            <Button onClick={handleCreatePincode}>+ Add Pincode</Button>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div>
              <label>Filter by City:</label>
              <select
                value={pincodeFilter.cityId?.toString() || ''}
                onChange={(e) => setPincodeFilter({ ...pincodeFilter, cityId: e.target.value ? parseInt(e.target.value) : null })}
                style={{ padding: '8px', marginLeft: '10px' }}
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Serviceable:</label>
              <select
                value={pincodeFilter.serviceable === null ? '' : pincodeFilter.serviceable.toString()}
                onChange={(e) => setPincodeFilter({ ...pincodeFilter, serviceable: e.target.value === '' ? null : e.target.value === 'true' })}
                style={{ padding: '8px', marginLeft: '10px' }}
              >
                <option value="">All</option>
                <option value="true">Serviceable</option>
                <option value="false">Non-Serviceable</option>
              </select>
            </div>
          </div>

          {showPincodeForm && (
            <Card style={{ marginBottom: '20px', padding: '20px' }}>
              <h3>{editingPincode ? 'Edit Pincode' : 'Create Pincode'}</h3>
              <form onSubmit={handleSubmitPincode}>
                <div style={{ marginBottom: '15px' }}>
                  <label>Pincode (6 digits) *</label>
                  <input
                    type="text"
                    value={pincodeForm.code}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>City *</label>
                  <select
                    value={pincodeForm.cityId}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, cityId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.state?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={pincodeForm.serviceable}
                      onChange={(e) => setPincodeForm({ ...pincodeForm, serviceable: e.target.checked })}
                    />
                    Serviceable
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="submit">{editingPincode ? 'Update' : 'Create'}</Button>
                  <Button type="button" onClick={() => setShowPincodeForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {pincodes.map((pincode) => (
              <Card key={pincode.id || pincode.pincode} style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{pincode.pincode || pincode.code}</h3>
                    <p>{pincode.cityName}, {pincode.stateName}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <span style={{ color: pincode.serviceable ? '#28a745' : '#dc3545' }}>
                        {pincode.serviceable ? '✓ Serviceable' : '✗ Non-Serviceable'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button onClick={() => handleEditPincode(pincode)}>Edit</Button>
                    {pincode.cityId && (
                      <Button onClick={() => handleMarkCityServiceable(pincode.cityId)}>
                        Mark City Serviceable
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationManagement;
