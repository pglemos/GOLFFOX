// ========================================
// GolfFox Create Vehicle Page v11.0
// Pagina para criar e editar veiculos
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../ui/widgets/common/gf_app_bar.dart';
import '../../ui/widgets/common/gf_loading_indicator.dart';
import '../../models/vehicle.dart';
import '../../services/vehicle_service.dart';

class CreateVehiclePage extends ConsumerStatefulWidget {
  final Vehicle? vehicle;

  const CreateVehiclePage({
    super.key,
    this.vehicle,
  });

  @override
  ConsumerState<CreateVehiclePage> createState() => _CreateVehiclePageState();
}

class _CreateVehiclePageState extends ConsumerState<CreateVehiclePage>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();
  
  // Controllers
  final _nameController = TextEditingController();
  final _licensePlateController = TextEditingController();
  final _chassisController = TextEditingController();
  final _renavamController = TextEditingController();
  final _manufacturerController = TextEditingController();
  final _modelController = TextEditingController();
  final _colorController = TextEditingController();
  final _yearController = TextEditingController();
  final _capacityController = TextEditingController();
  final _engineSizeController = TextEditingController();
  final _fuelTankController = TextEditingController();
  final _weightController = TextEditingController();
  final _lengthController = TextEditingController();
  final _widthController = TextEditingController();
  final _heightController = TextEditingController();
  final _insuranceCompanyController = TextEditingController();
  final _insurancePolicyController = TextEditingController();
  final _notesController = TextEditingController();

  // Form data
  VehicleType _selectedType = VehicleType.bus;
  VehicleStatus _selectedStatus = VehicleStatus.active;
  FuelType _selectedFuelType = FuelType.diesel;
  DateTime? _licenseExpiryDate;
  DateTime? _inspectionExpiryDate;
  DateTime? _insuranceExpiryDate;
  List<String> _selectedFeatures = [];

  int _currentPage = 0;
  bool _isLoading = false;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  final List<String> _availableFeatures = [
    'GPS',
    'Ar Condicionado',
    'Wi-Fi',
    'Security Cameras',
    'Sistema de Som',
    'USB/Carregadores',
    'Acessibilidade',
    'Safety Belts',
    'Extintor',
    'Kit Primeiros Socorros',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.forward();

    if (widget.vehicle != null) {
      _loadVehicleData();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _licensePlateController.dispose();
    _chassisController.dispose();
    _renavamController.dispose();
    _manufacturerController.dispose();
    _modelController.dispose();
    _colorController.dispose();
    _yearController.dispose();
    _capacityController.dispose();
    _engineSizeController.dispose();
    _fuelTankController.dispose();
    _weightController.dispose();
    _lengthController.dispose();
    _widthController.dispose();
    _heightController.dispose();
    _insuranceCompanyController.dispose();
    _insurancePolicyController.dispose();
    _notesController.dispose();
    _pageController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _loadVehicleData() {
    final vehicle = widget.vehicle!;
    _nameController.text = vehicle.name;
    _licensePlateController.text = vehicle.documents.licensePlate ?? '';
    _chassisController.text = vehicle.documents.chassisNumber ?? '';
    _renavamController.text = vehicle.documents.renavam ?? '';
    _manufacturerController.text = vehicle.specifications.manufacturer;
    _modelController.text = vehicle.specifications.model;
    _colorController.text = vehicle.specifications.color;
    _yearController.text = vehicle.specifications.year.toString();
    _capacityController.text = vehicle.specifications.capacity.toString();
    _engineSizeController.text = vehicle.specifications.engineSize.toString();
    _fuelTankController.text = vehicle.specifications.fuelTankCapacity.toString();
    _weightController.text = vehicle.specifications.weight.toString();
    _lengthController.text = vehicle.specifications.length.toString();
    _widthController.text = vehicle.specifications.width.toString();
    _heightController.text = vehicle.specifications.height.toString();
    _insuranceCompanyController.text = vehicle.documents.insuranceCompany ?? '';
    _insurancePolicyController.text = vehicle.documents.insurancePolicyNumber ?? '';
    _notesController.text = vehicle.notes ?? '';

    _selectedType = vehicle.type;
    _selectedStatus = vehicle.status;
    _selectedFuelType = vehicle.fuelType;
    _licenseExpiryDate = vehicle.documents.licenseExpiryDate;
    _inspectionExpiryDate = vehicle.documents.inspectionExpiryDate;
    _insuranceExpiryDate = vehicle.documents.insuranceExpiryDate;
    _selectedFeatures = List.from(vehicle.features);
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _saveVehicle() async {
    final formState = _formKey.currentState;
    if (formState == null || !formState.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final vehicle = Vehicle(
        id: widget.vehicle?.id ?? '',
        name: _nameController.text,
        type: _selectedType,
        status: _selectedStatus,
        fuelType: _selectedFuelType,
        specifications: VehicleSpecifications(
          capacity: int.parse(_capacityController.text),
          engineSize: double.parse(_engineSizeController.text),
          year: int.parse(_yearController.text),
          manufacturer: _manufacturerController.text,
          model: _modelController.text,
          color: _colorController.text,
          fuelTankCapacity: double.parse(_fuelTankController.text),
          weight: double.parse(_weightController.text),
          length: double.parse(_lengthController.text),
          width: double.parse(_widthController.text),
          height: double.parse(_heightController.text),
        ),
        documents: VehicleDocuments(
          licensePlate: _licensePlateController.text,
          chassisNumber: _chassisController.text,
          renavam: _renavamController.text,
          licenseExpiryDate: _licenseExpiryDate,
          inspectionExpiryDate: _inspectionExpiryDate,
          insuranceExpiryDate: _insuranceExpiryDate,
          insuranceCompany: _insuranceCompanyController.text,
          insurancePolicyNumber: _insurancePolicyController.text,
        ),
        features: _selectedFeatures,
        notes: _notesController.text,
        createdAt: widget.vehicle?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
        companyId: 'company_1',
      );

      if (widget.vehicle == null) {
        await ref.read(vehicleServiceProvider).createVehicle(vehicle);
      } else {
        await ref.read(vehicleServiceProvider).updateVehicle(vehicle);
      }

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao salvar veiculo: $e'),
            backgroundColor: const Color(GfTokens.colorError),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(GfTokens.colorSurfaceBackground),
      appBar: GfAppBar(
        title: widget.vehicle == null ? 'New Vehicle' : 'Edit Vehicle',
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            TextButton(
              onPressed: _saveVehicle,
              child: Text(
                'Salvar',
                style: TextStyle(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            // Indicador de progresso
            Container(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              decoration: BoxDecoration(
                color: const Color(GfTokens.colorSurface),
                border: Border(
                  bottom: BorderSide(color: const Color(GfTokens.colorBorder),
                ),
              ),
              child: Row(
                children: [
                  for (int i = 0; i < 3; i++) ...[
                    Expanded(
                      child: Container(
                        height: 4,
                        decoration: BoxDecoration(
                          color: i <= _currentPage
                              ? GfTokens.colorPrimary
                              : GfTokens.colorBorder,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    if (i < 2) const SizedBox(width: GfTokens.spacingSm),
                  ],
                ],
              ),
            ),

            // Conteudo
            Expanded(
              child: Form(
                key: _formKey,
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (page) {
                    setState(() {
                      _currentPage = page;
                    });
                  },
                  children: [
                    _buildBasicInfoPage(),
                    _buildSpecificationsPage(),
                    _buildDocumentsPage(),
                  ],
                ),
              ),
            ),

            // Botoes de navegacao
            Container(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              decoration: BoxDecoration(
                color: const Color(GfTokens.colorSurface),
                border: Border(
                  top: BorderSide(color: const Color(GfTokens.colorBorder),
                ),
              ),
              child: Row(
                children: [
                  if (_currentPage > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _previousPage,
                        child: const Text('Anterior'),
                      ),
                    ),
                  if (_currentPage > 0) const SizedBox(width: GfTokens.spacingMd),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _currentPage < 2 ? _nextPage : _saveVehicle,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(GfTokens.colorPrimary),
                        foregroundColor: const Color(GfTokens.colorOnPrimary),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(_currentPage < 2 ? 'Proximo' : 'Salvar'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informacoes Basicas',
            style: TextStyle(
              fontSize: GfTokens.fontSizeXl,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Nome
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Nome do Veiculo',
              hintText: 'Ex: Onibus Escolar 001',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Nome e obrigatorio';
              }
              return null;
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Tipo
          DropdownButtonFormField<VehicleType>(
            value: _selectedType,
            decoration: const InputDecoration(
              labelText: 'Tipo de Veiculo',
            ),
            items: VehicleType.values.map((type) {
              return DropdownMenuItem(
                value: type,
                child: Text(type.displayName),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedType = value;
                });
              }
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Status
          DropdownButtonFormField<VehicleStatus>(
            value: _selectedStatus,
            decoration: const InputDecoration(
              labelText: 'Status',
            ),
            items: VehicleStatus.values.map((status) {
              return DropdownMenuItem(
                value: status,
                child: Text(status.displayName),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedStatus = value;
                });
              }
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Combustivel
          DropdownButtonFormField<FuelType>(
            value: _selectedFuelType,
            decoration: const InputDecoration(
              labelText: 'Tipo de Combustivel',
            ),
            items: FuelType.values.map((fuel) {
              return DropdownMenuItem(
                value: fuel,
                child: Text(fuel.displayName),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedFuelType = value;
                });
              }
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Placa
          TextFormField(
            controller: _licensePlateController,
            decoration: const InputDecoration(
              labelText: 'Placa',
              hintText: 'ABC-1234',
            ),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9-]')),
              LengthLimitingTextInputFormatter(8),
            ],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Placa e obrigatoria';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSpecificationsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Especificacoes',
            style: TextStyle(
              fontSize: GfTokens.fontSizeXl,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Fabricante e Modelo
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _manufacturerController,
                  decoration: const InputDecoration(
                    labelText: 'Fabricante',
                    hintText: 'Mercedes-Benz',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Fabricante e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _modelController,
                  decoration: const InputDecoration(
                    labelText: 'Modelo',
                    hintText: 'OF-1721',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Modelo e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Ano e Cor
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _yearController,
                  decoration: const InputDecoration(
                    labelText: 'Ano',
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(4),
                  ],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Ano e obrigatorio';
                    }
                    final year = int.tryParse(value);
                    if (year == null || year < 1900 || year > DateTime.now().year + 1) {
                      return 'Ano invalido';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _colorController,
                  decoration: const InputDecoration(
                    labelText: 'Cor',
                    hintText: 'Branco',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Cor e obrigatoria';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Capacidade e Motor
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _capacityController,
                  decoration: const InputDecoration(
                    labelText: 'Capacidade (passageiros)',
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Capacidade e obrigatoria';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _engineSizeController,
                  decoration: const InputDecoration(
                    labelText: 'Motor (L)',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Tamanho do motor e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Tanque e Peso
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _fuelTankController,
                  decoration: const InputDecoration(
                    labelText: 'Tanque (L)',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Capacidade do tanque e obrigatoria';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _weightController,
                  decoration: const InputDecoration(
                    labelText: 'Peso (kg)',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Peso e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Dimensoes
          Text(
            'Dimensoes',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),

          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _lengthController,
                  decoration: const InputDecoration(
                    labelText: 'Comprimento (m)',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Comprimento e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _widthController,
                  decoration: const InputDecoration(
                    labelText: 'Largura (m)',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Largura e obrigatoria';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _heightController,
                  decoration: const InputDecoration(
                    labelText: 'Altura (m)',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Altura e obrigatoria';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Recursos
          Text(
            'Recursos',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),

          Wrap(
            spacing: GfTokens.spacingSm,
            runSpacing: GfTokens.spacingSm,
            children: _availableFeatures.map((feature) {
              final isSelected = _selectedFeatures.contains(feature);
              return FilterChip(
                label: Text(feature),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedFeatures.add(feature);
                    } else {
                      _selectedFeatures.remove(feature);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Documentos',
            style: TextStyle(
              fontSize: GfTokens.fontSizeXl,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Chassi e RENAVAM
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _chassisController,
                  decoration: const InputDecoration(
                    labelText: 'Chassi',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Chassi e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              Expanded(
                child: TextFormField(
                  controller: _renavamController,
                  decoration: const InputDecoration(
                    labelText: 'RENAVAM',
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'RENAVAM e obrigatorio';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Datas de vencimento
          Text(
            'Vencimentos',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),

          _buildDateField(
            label: 'Vencimento da Licenca',
            date: _licenseExpiryDate,
            onDateSelected: (date) {
              setState(() {
                _licenseExpiryDate = date;
              });
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          _buildDateField(
            label: 'Vencimento da Vistoria',
            date: _inspectionExpiryDate,
            onDateSelected: (date) {
              setState(() {
                _inspectionExpiryDate = date;
              });
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          _buildDateField(
            label: 'Vencimento do Seguro',
            date: _insuranceExpiryDate,
            onDateSelected: (date) {
              setState(() {
                _insuranceExpiryDate = date;
              });
            },
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Seguro
          Text(
            'Seguro',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),

          TextFormField(
            controller: _insuranceCompanyController,
            decoration: const InputDecoration(
              labelText: 'Seguradora',
            ),
          ),
          const SizedBox(height: GfTokens.spacingMd),

          TextFormField(
            controller: _insurancePolicyController,
            decoration: const InputDecoration(
              labelText: 'Numero da Apolice',
            ),
          ),
          const SizedBox(height: GfTokens.spacingMd),

          // Observacoes
          TextFormField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Observacoes',
              hintText: 'Informacoes adicionais sobre o veiculo...',
            ),
            maxLines: 3,
          ),
        ],
      ),
    );
  }

  Widget _buildDateField({
    required String label,
    required DateTime? date,
    required ValueChanged<DateTime> onDateSelected,
  }) {
    return InkWell(
      onTap: () async {
        final selectedDate = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
        );
        if (selectedDate != null) {
          onDateSelected(selectedDate);
        }
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today),
        ),
        child: Text(
          date != null
              ? '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}'
              : 'Selecionar data',
          style: TextStyle(
            color: date != null ? GfTokens.colorOnSurface : GfTokens.colorOnSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
