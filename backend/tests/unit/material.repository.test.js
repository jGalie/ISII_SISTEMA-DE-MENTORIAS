const { crearRepositorioMaterial } = require('../../src/repositories/material.repository');

describe('Repository de materiales', () => {
  test('lista materiales por clase mediante MySQL', async () => {
    const rows = [
      {
        id_material: 4,
        id_clase: 2,
        titulo: 'Apunte',
        url: 'https://example.com/apunte.pdf',
        fecha_creacion: '2026-06-06T12:00:00.000Z',
      },
    ];
    const pool = {
      query: jest.fn().mockResolvedValue([rows]),
    };
    const repository = crearRepositorioMaterial({ pool });

    const resultado = await repository.buscarPorClase(2);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM materiales'),
      [2]
    );
    expect(resultado).toEqual(rows);
  });

  test('crea el material en MySQL y recupera el registro insertado', async () => {
    const rowCreada = {
      id_material: 8,
      id_clase: 2,
      titulo: 'Video',
      url: 'https://example.com/video',
      fecha_creacion: '2026-06-06T12:00:00.000Z',
    };
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ insertId: 8 }])
        .mockResolvedValueOnce([[rowCreada]]),
    };
    const repository = crearRepositorioMaterial({ pool });

    const resultado = await repository.crear({
      id_clase: 2,
      titulo: 'Video',
      url: 'https://example.com/video',
    });

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO materiales'),
      [2, 'Video', 'https://example.com/video']
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE id_material = ?'),
      [8]
    );
    expect(resultado).toEqual(rowCreada);
  });
});
