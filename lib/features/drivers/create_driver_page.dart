// ========================================
// GolfFox Create Driver Page v11.0
// Página para criar e editar motoristas
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/driver.dart';
import '../../services/driver_service.dart';
import '../../ui/widgets/common/gf_app_bar.dart';
import '../../ui/widgets/common/gf_loading_indicator.dart';

class CreateDriverPage extends ConsumerStatefulWidget {

  const CreateDriverPage({
    super.key,
    this.driver,
  });
  final Driver? driver;

  @override
  ConsumerState<CreateDriverPage> createState() => _CreateDriverPageState();
}

class _CreateDriverPageState extends ConsumerState<CreateDriverPage> {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();
  
  // Controladores de texto
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _licenseNumberController = TextEditingController();
  final _licenseIssuerController = TextEditingController();
  final _emergencyContactController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  
  // Estado do formulario
  int _currentPage = 0;
  bool _isLoading = false;
  DateTime? _birthDate;
  DateTime? _hireDate;
  DateTime? _licenseIssueDate;
  DateTime? _licenseExpiryDate;
  DriverStatus _status = DriverStatus.active;
  LicenseCategory _licenseCategory = LicenseCategory.b;
  bool _isOnline = false;
  bool _isAvailable = true;
  String? _photoUrl;
  List<DriverCertification> _certifications = [];

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _licenseNumberController.dispose();
    _licenseIssuerController.dispose();
    _emergencyContactController.dispose();
    _emergencyPhoneController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _initializeForm() {
    if (widget.driver != null) {
      final driver = widget.driver!;
      _nameController.text = driver.name;
      _emailController.text = driver.email;
      _phoneController.text = driver.phone ?? '';
      _addressController.text = driver.address ?? '';
      _licenseNumberController.text = driver.license.number;
      _licenseIssuerController.text = driver.license.issuingAuthority;
      _emergencyContactController.text = driver.emergencyContact ?? '';
      _emergencyPhoneController.text = driver.emergencyPhone ?? '';
      
      _birthDate = driver.birthDate;
      // _hireDate is not part of Driver model; keep null unless set via UI
      _licenseIssueDate = driver.license.issueDate;
      _licenseExpiryDate = driver.license.expiryDate;
      _status = driver.status;
      _licenseCategory = driver.license.category;
      _isOnline = driver.isOnline;
      _isAvailable = driver.isAvailable;
      _photoUrl = driver.profileImageUrl;
      _certifications = List.from(driver.certifications);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.driver != null;
    
    return Scaffold(
      backgroundColor: const Color(GfTokens.colorBackground),
      appBar: GfAppBar(
        title: isEditing ? 'Editar motorista' : 'Novo motorista',
        actions: [
          if (_currentPage > 0)
            TextButton(
              onPressed: _previousPage,
              child: const Text('Anterior'),
            ),
          if (_currentPage < 2)
            TextButton(
              onPressed: _nextPage,
              child: const Text('Próximo'),
            )
          else
            TextButton(
              onPressed: _isLoading ? null : _saveDriver,
              child: _isLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(isEditing ? 'Salvar' : 'Criar'),
            ),
        ],
      ),
      body: Column(
        children: [
          // Indicador de progresso
          Container(
            padding: const EdgeInsets.all(GfTokens.spacingMd),
            decoration: const BoxDecoration(
              color: Color(GfTokens.colorSurface),
              border: Border(
                bottom: BorderSide(color: Color(GfTokens.colorBorder)),
              ),
            ),
            child: Row(
              children: [
                _buildStepIndicator(0, 'Pessoal'),
                _buildStepConnector(),
                _buildStepIndicator(1, 'Licença'),
                _buildStepConnector(),
                _buildStepIndicator(2, 'Certificações'),
              ],
            ),
          ),

          // Formulario
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
                  _buildPersonalInfoPage(),
                  _buildLicenseInfoPage(),
                  _buildCertificationsPage(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label) {
    final isActive = step == _currentPage;
    final isCompleted = step < _currentPage;
    
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isCompleted
                  ? const Color(GfTokens.colorSuccess)
                  : isActive
                      ? const Color(GfTokens.colorPrimary)
                      : const Color(GfTokens.colorOnSurfaceVariant).withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCompleted
                  ? Icons.check
                  : isActive
                      ? Icons.circle
                      : Icons.circle_outlined,
              color: Colors.white,
              size: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: GfTokens.fontSizeXs,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              color: isActive
                  ? const Color(GfTokens.colorPrimary)
                  : const Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector() => Container(
      height: 2,
      width: 32,
      color: const Color(GfTokens.colorBorder),
      margin: const EdgeInsets.only(bottom: 20),
    );

  Widget _buildPersonalInfoPage() => SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informações Pessoais',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          
          const SizedBox(height: GfTokens.spacingMd),

          // Foto do perfil
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: const Color(GfTokens.colorPrimary).withOpacity(0.1),
                  backgroundImage: _photoUrl != null 
                      ? NetworkImage(_photoUrl!)
                      : null,
                  child: _photoUrl == null
                      ? Icon(
                          Icons.person,
                          size: 50,
                          color: const Color(GfTokens.colorPrimary),
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(GfTokens.colorPrimary),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: _selectPhoto,
                      icon: const Icon(
                        Icons.camera_alt,
                        color: Colors.white,
                        size: 20,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 36,
                        minHeight: 36,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: GfTokens.spacingLg),

          // Nome completo
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Nome Completo *',
              prefixIcon: Icon(Icons.person),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nome é obrigatório';
              }
              return null;
            },
            textCapitalization: TextCapitalization.words,
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // E-mail
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'E-mail *',
              prefixIcon: Icon(Icons.email),
            ),
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'E-mail é obrigatório';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'E-mail inválido';
              }
              return null;
            },
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Telefone
          TextFormField(
            controller: _phoneController,
            decoration: const InputDecoration(
              labelText: 'Telefone *',
              prefixIcon: Icon(Icons.phone),
              hintText: '(11) 99999-9999',
            ),
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(11),
            ],
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Telefone é obrigatório';
              }
              if (value.length < 10) {
                return 'Telefone deve ter pelo menos 10 digitos';
              }
              return null;
            },
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Data de nascimento
          InkWell(
            onTap: _selectBirthDate,
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Data de Nascimento *',
                prefixIcon: Icon(Icons.calendar_today),
              ),
              child: Text(
                _birthDate != null
                    ? '${_birthDate!.day.toString().padLeft(2, '0')}/${_birthDate!.month.toString().padLeft(2, '0')}/${_birthDate!.year}'
                    : 'Selecionar data',
                style: TextStyle(
                  color: _birthDate != null
                      ? const Color(GfTokens.colorOnSurface)
                      : const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ),
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Endereço
          TextFormField(
            controller: _addressController,
            decoration: const InputDecoration(
              labelText: 'Endereço',
              prefixIcon: Icon(Icons.location_on),
            ),
            maxLines: 2,
            textCapitalization: TextCapitalization.words,
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Status
          DropdownButtonFormField<DriverStatus>(
            value: _status,
            decoration: const InputDecoration(
              labelText: 'Status *',
              prefixIcon: Icon(Icons.info),
            ),
            items: DriverStatus.values.map((status) {
              return DropdownMenuItem(
                value: status,
                child: Row(
                  children: [
                    Icon(
                      status.iconData,
                      size: 16,
                      color: status.colorValue,
                    ),
                    const SizedBox(width: 8),
                    Text(status.displayName),
                  ],
                ),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _status = value;
                });
              }
            },
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Data de contratacao
          InkWell(
            onTap: _selectHireDate,
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Data de Contratacao',
                prefixIcon: Icon(Icons.work),
              ),
              child: Text(
                _hireDate != null
                    ? '${_hireDate!.day.toString().padLeft(2, '0')}/${_hireDate!.month.toString().padLeft(2, '0')}/${_hireDate!.year}'
                    : 'Selecionar data',
                style: TextStyle(
                  color: _hireDate != null
                      ? const Color(GfTokens.colorOnSurface)
                      : const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ),
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Contato de emergência
          TextFormField(
            controller: _emergencyContactController,
            decoration: const InputDecoration(
              labelText: 'Contato de Emergência',
              prefixIcon: Icon(Icons.emergency),
            ),
            textCapitalization: TextCapitalization.words,
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Telefone de emergência
          TextFormField(
            controller: _emergencyPhoneController,
            decoration: const InputDecoration(
              labelText: 'Telefone de Emergência',
              prefixIcon: Icon(Icons.phone_in_talk),
              hintText: '(11) 99999-9999',
            ),
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(11),
            ],
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Switches
          Row(
            children: [
              Expanded(
                child: SwitchListTile(
                  title: const Text('Online'),
                  subtitle: const Text('Disponivel para receber viagens'),
                  value: _isOnline,
                  onChanged: (value) {
                    setState(() {
                      _isOnline = value;
                    });
                  },
                ),
              ),
              Expanded(
                child: SwitchListTile(
                  title: const Text('Disponivel'),
                  subtitle: const Text('Pode ser atribuido a veículos'),
                  value: _isAvailable,
                  onChanged: (value) {
                    setState(() {
                      _isAvailable = value;
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.1);

  Widget _buildLicenseInfoPage() => SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informações da Licença',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
          
          const SizedBox(height: GfTokens.spacingMd),

          // Número da licença
          TextFormField(
            controller: _licenseNumberController,
            decoration: const InputDecoration(
              labelText: 'Número da Licença *',
              prefixIcon: Icon(Icons.credit_card),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Número da licença é obrigatório';
              }
              return null;
            },
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Órgão emissor
          TextFormField(
            controller: _licenseIssuerController,
            decoration: const InputDecoration(
              labelText: 'Órgão emissor *',
              prefixIcon: Icon(Icons.apartment),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Órgão emissor é obrigatório';
              }
              return null;
            },
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Categoria da licença
          DropdownButtonFormField<LicenseCategory>(
            value: _licenseCategory,
            decoration: const InputDecoration(
              labelText: 'Categoria *',
              prefixIcon: Icon(Icons.category),
            ),
            items: LicenseCategory.values.map((category) {
              return DropdownMenuItem(
                value: category,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.displayName,
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                    Text(
                      category.description,
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeXs,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _licenseCategory = value;
                });
              }
            },
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Data de emissão da licença
          InkWell(
            onTap: _selectLicenseIssueDate,
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Data de emissão *',
                prefixIcon: Icon(Icons.event_note),
              ),
              child: Text(
                _licenseIssueDate != null
                    ? '${_licenseIssueDate!.day.toString().padLeft(2, '0')}/${_licenseIssueDate!.month.toString().padLeft(2, '0')}/${_licenseIssueDate!.year}'
                    : 'Selecionar data',
                style: TextStyle(
                  color: _licenseIssueDate != null
                      ? const Color(GfTokens.colorOnSurface)
                      : const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ),
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Data de vencimento da licença
          InkWell(
            onTap: _selectLicenseExpiryDate,
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: 'Data de Vencimento *',
                prefixIcon: const Icon(Icons.event),
                suffixIcon: _licenseExpiryDate != null &&
                        _licenseExpiryDate!.isBefore(DateTime.now().add(const Duration(days: 30)))
                    ? const Icon(
                        Icons.warning,
                        color: Color(GfTokens.colorWarning),
                      )
                    : null,
              ),
              child: Text(
                _licenseExpiryDate != null
                    ? '${_licenseExpiryDate!.day.toString().padLeft(2, '0')}/${_licenseExpiryDate!.month.toString().padLeft(2, '0')}/${_licenseExpiryDate!.year}'
                    : 'Selecionar data',
                style: TextStyle(
                  color: _licenseExpiryDate != null
                      ? const Color(GfTokens.colorOnSurface)
                      : const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ),
          ),

          if (_licenseExpiryDate != null &&
              _licenseExpiryDate!.isBefore(DateTime.now().add(const Duration(days: 30))))
            Padding(
              padding: const EdgeInsets.only(top: GfTokens.spacingSm),
              child: Row(
                children: [
                  const Icon(
                    Icons.warning,
                    size: 16,
                    color: Color(GfTokens.colorWarning),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _licenseExpiryDate!.isBefore(DateTime.now())
                          ? 'Licença vencida!'
                          : 'Licença vence em breve!',
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeSm,
                        color: Color(GfTokens.colorWarning),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.1);

  Widget _buildCertificationsPage() => SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Certificações',
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeLg,
                    fontWeight: FontWeight.w600,
                    color: const Color(GfTokens.colorOnSurface),
                  ),
                ),
              ),
              ElevatedButton.icon(
                onPressed: _addCertification,
                icon: const Icon(Icons.add),
                label: const Text('Adicionar'),
              ),
            ],
          ),
          
          const SizedBox(height: GfTokens.spacingMd),

          if (_certifications.isEmpty)
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.verified,
                    size: 64,
                    color: const Color(GfTokens.colorOnSurfaceVariant),
                  ),
                  const SizedBox(height: GfTokens.spacingMd),
                  Text(
                    'Nenhuma certificacao adicionada',
                    style: TextStyle(
                      color: const Color(GfTokens.colorOnSurfaceVariant),
                    ),
                  ),
                  const SizedBox(height: GfTokens.spacingSm),
                  Text(
                    'Adicione certificações para melhorar o perfil do motorista.',
                    style: TextStyle(
                      fontSize: GfTokens.fontSizeSm,
                      color: const Color(GfTokens.colorOnSurfaceVariant),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _certifications.length,
              itemBuilder: (context, index) {
                final certification = _certifications[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: GfTokens.spacingMd),
                  child: ListTile(
                    leading: Icon(
                      Icons.verified,
                      color: certification.isExpired
                          ? const Color(GfTokens.colorError)
                          : certification.isExpiringSoon
                              ? const Color(GfTokens.colorWarning)
                              : const Color(GfTokens.colorSuccess),
                    ),
                    title: Text(certification.name),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Emissor: ${certification.issuingOrganization}'),
                        if (certification.expiryDate != null)
                          Text(
                            'Vence em: ${certification.expiryDate!.day.toString().padLeft(2, '0')}/${certification.expiryDate!.month.toString().padLeft(2, '0')}/${certification.expiryDate!.year}',
                            style: TextStyle(
                              color: certification.isExpired
                                  ? const Color(GfTokens.colorError)
                                  : certification.isExpiringSoon
                                      ? const Color(GfTokens.colorWarning)
                                      : const Color(GfTokens.colorOnSurfaceVariant),
                            ),
                          )
                        else
                          Text(
                            'Sem data de validade',
                            style: TextStyle(
                              color: const Color(GfTokens.colorOnSurfaceVariant),
                              fontSize: GfTokens.fontSizeSm,
                            ),
                          ),
                      ],
                    ),
                    trailing: IconButton(
                      onPressed: () => _removeCertification(index),
                      icon: const Icon(Icons.delete, color: Colors.red),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.1);

  void _nextPage() {
    if (_currentPage < 2) {
      if (_validateCurrentPage()) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }
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

  bool _validateCurrentPage() {
    switch (_currentPage) {
      case 0:
        return _validatePersonalInfo();
      case 1:
        return _validateLicenseInfo();
      case 2:
        return true; // Certificações sao opcionais
      default:
        return false;
    }
  }

  bool _validatePersonalInfo() {
    if (_nameController.text.trim().isEmpty) {
      _showError('Nome é obrigatório');
      return false;
    }
    if (_emailController.text.trim().isEmpty) {
      _showError('E-mail é obrigatório');
      return false;
    }
    if (_phoneController.text.trim().isEmpty) {
      _showError('Telefone é obrigatório');
      return false;
    }
    if (_birthDate == null) {
      _showError('Data de nascimento é obrigatória');
      return false;
    }
    return true;
  }

  bool _validateLicenseInfo() {
    if (_licenseNumberController.text.trim().isEmpty) {
      _showError('Número da licença é obrigatório');
      return false;
    }
    if (_licenseIssuerController.text.trim().isEmpty) {
      _showError('Órgão emissor é obrigatório');
      return false;
    }
    if (_licenseIssueDate == null) {
      _showError('Data de emissão da licença é obrigatória');
      return false;
    }
    if (_licenseExpiryDate == null) {
      _showError('Data de vencimento da licença é obrigatória');
      return false;
    }
    return true;
  }

  void _selectPhoto() {
    // TODO: Implementar selecao de foto
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Funcionalidade de foto sera implementada em breve'),
      ),
    );
  }

  Future<void> _selectBirthDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime.now().subtract(const Duration(days: 365 * 25)),
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 80)),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
    );
    
    if (date != null) {
      setState(() {
        _birthDate = date;
      });
    }
  }

  Future<void> _selectHireDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _hireDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 10)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (date != null) {
      setState(() {
        _hireDate = date;
      });
    }
  }

  Future<void> _selectLicenseIssueDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _licenseIssueDate ?? DateTime.now().subtract(const Duration(days: 365)),
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 20)),
      lastDate: DateTime.now(),
    );

    if (date != null) {
      setState(() {
        _licenseIssueDate = date;
      });
    }
  }

  Future<void> _selectLicenseExpiryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _licenseExpiryDate ?? DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
    );
    
    if (date != null) {
      setState(() {
        _licenseExpiryDate = date;
      });
    }
  }

  void _addCertification() {
    // TODO: Implementar adicao de certificacao
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Funcionalidade de certificacao sera implementada em breve'),
      ),
    );
  }

  void _removeCertification(int index) {
    setState(() {
      _certifications.removeAt(index);
    });
  }

  Future<void> _saveDriver() async {
    final formState = _formKey.currentState;
    if (formState == null || !formState.validate() || !_validateCurrentPage()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final driver = Driver(
        id: widget.driver?.id ?? '',
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        birthDate: _birthDate,
        status: _status,
        license: DriverLicense(
          number: _licenseNumberController.text.trim(),
          category: _licenseCategory,
          issueDate: _licenseIssueDate!,
          expiryDate: _licenseExpiryDate!,
          issuingAuthority: _licenseIssuerController.text.trim(),
        ),
        certifications: _certifications,
        isOnline: _isOnline,
        emergencyContact: _emergencyContactController.text.trim(),
        emergencyPhone: _emergencyPhoneController.text.trim(),
        ratings: widget.driver?.ratings ?? [],
        stats: widget.driver?.stats ?? DriverStats(lastTripDate: DateTime.now()),
        currentVehicleId: widget.driver?.currentVehicleId,
        preferences: widget.driver?.preferences ?? {},
        createdAt: widget.driver?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final service = ref.read(driverServiceProvider.notifier);
      
      if (widget.driver != null) {
        await service.updateDriver(driver);
        _showSuccess('Motorista atualizado com sucesso!');
      } else {
        await service.createDriver(driver);
        _showSuccess('Motorista criado com sucesso!');
      }

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      _showError('Erro ao salvar motorista: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(GfTokens.colorError),
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(GfTokens.colorSuccess),
      ),
    );
  }
}

