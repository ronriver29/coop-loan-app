import React, { useState, useEffect } from 'react';
import { psgcService, PSGCResource } from '../services/psgcService';

interface PSGCAddressSelectorsProps {
  initialValues?: {
    region: string;
    province: string;
    city: string;
    barangay: string;
  };
  onChange: (values: {
    region: string;
    province: string;
    city: string;
    barangay: string;
  }) => void;
}

export default function PSGCAddressSelectors({ initialValues, onChange }: PSGCAddressSelectorsProps) {
  const [regions, setRegions] = useState<PSGCResource[]>([]);
  const [provinces, setProvinces] = useState<PSGCResource[]>([]);
  const [cities, setCities] = useState<PSGCResource[]>([]);
  const [barangays, setBarangays] = useState<PSGCResource[]>([]);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  // Codes are needed for API, names are needed for the Parent's state
  const [regionCode, setRegionCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [cityCode, setCityCode] = useState('');

  useEffect(() => {
    psgcService.getRegions().then(data => {
      setRegions(data);
      
      // If initial values exist, try to find the region code by name to trigger cascade
      if (initialValues?.region) {
        const region = data.find(r => r.name === initialValues.region);
        if (region) {
          setRegionCode(region.code);
          setSelectedRegion(region.name);
          psgcService.getProvinces(region.code).then(provs => {
            setProvinces(provs);
            if (initialValues.province) {
              const prov = provs.find(p => p.name === initialValues.province);
              if (prov) {
                setProvinceCode(prov.code);
                setSelectedProvince(prov.name);
                psgcService.getCities(prov.code).then(cts => {
                  setCities(cts);
                  if (initialValues.city) {
                    const city = cts.find(c => c.name === initialValues.city);
                    if (city) {
                      setCityCode(city.code);
                      setSelectedCity(city.name);
                      psgcService.getBarangays(city.code).then(brgys => {
                        setBarangays(brgys);
                        if (initialValues.barangay) {
                          const brgy = brgys.find(b => b.name === initialValues.barangay);
                          if (brgy) {
                            setSelectedBarangay(brgy.name);
                          }
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  }, []); // Only on mount

  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const region = regions.find(r => r.code === code);
    const name = region?.name || '';
    
    setRegionCode(code);
    setSelectedRegion(name);
    
    // Reset children
    setProvinceCode('');
    setSelectedProvince('');
    setCityCode('');
    setSelectedCity('');
    setSelectedBarangay('');
    
    if (code) {
      const data = await psgcService.getProvinces(code);
      setProvinces(data);
    } else {
      setProvinces([]);
    }
    
    updateParent(name, '', '', '');
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const province = provinces.find(p => p.code === code);
    const name = province?.name || '';
    
    setProvinceCode(code);
    setSelectedProvince(name);
    
    // Reset children
    setCityCode('');
    setSelectedCity('');
    setSelectedBarangay('');
    
    if (code) {
      const data = await psgcService.getCities(code);
      setCities(data);
    } else {
      setCities([]);
    }
    
    updateParent(selectedRegion, name, '', '');
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const city = cities.find(c => c.code === code);
    const name = city?.name || '';
    
    setCityCode(code);
    setSelectedCity(name);
    
    // Reset children
    setSelectedBarangay('');
    
    if (code) {
      const data = await psgcService.getBarangays(code);
      setBarangays(data);
    } else {
      setBarangays([]);
    }
    
    updateParent(selectedRegion, selectedProvince, name, '');
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedBarangay(name);
    updateParent(selectedRegion, selectedProvince, selectedCity, name);
  };

  const updateParent = (r: string, p: string, c: string, b: string) => {
    onChange({
      region: r,
      province: p,
      city: c,
      barangay: b
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
      <div className="space-y-3">
        <label className="text-micro">Region</label>
        <select 
          className="organic-input font-medium appearance-none cursor-pointer"
          value={regionCode}
          onChange={handleRegionChange}
        >
          <option value="">Select Region</option>
          {regions.map(r => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-micro">Province</label>
        <select 
          className="organic-input font-medium appearance-none cursor-pointer disabled:opacity-50"
          value={provinceCode}
          onChange={handleProvinceChange}
          disabled={!regionCode}
        >
          <option value="">Select Province</option>
          {provinces.map(p => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-micro">City / Municipality</label>
        <select 
          className="organic-input font-medium appearance-none cursor-pointer disabled:opacity-50"
          value={cityCode}
          onChange={handleCityChange}
          disabled={!provinceCode}
        >
          <option value="">Select City / Municipality</option>
          {cities.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-micro">Barangay</label>
        <select 
          className="organic-input font-medium appearance-none cursor-pointer disabled:opacity-50"
          value={selectedBarangay}
          onChange={handleBarangayChange}
          disabled={!cityCode}
        >
          <option value="">Select Barangay</option>
          {barangays.map(b => (
            <option key={b.code} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
