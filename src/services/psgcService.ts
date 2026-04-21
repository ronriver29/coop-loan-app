export interface PSGCResource {
  code: string;
  name: string;
}

const BASE_URL = 'https://psgc.gitlab.io/api';

export const psgcService = {
  async getRegions(): Promise<PSGCResource[]> {
    const res = await fetch(`${BASE_URL}/regions/`);
    return res.json();
  },

  async getProvinces(regionCode: string): Promise<PSGCResource[]> {
    const res = await fetch(`${BASE_URL}/regions/${regionCode}/provinces/`);
    return res.json();
  },

  async getCities(provinceCode: string): Promise<PSGCResource[]> {
    const res = await fetch(`${BASE_URL}/provinces/${provinceCode}/cities-municipalities/`);
    return res.json();
  },

  async getBarangays(cityCode: string): Promise<PSGCResource[]> {
    const res = await fetch(`${BASE_URL}/cities-municipalities/${cityCode}/barangays/`);
    return res.json();
  }
};
