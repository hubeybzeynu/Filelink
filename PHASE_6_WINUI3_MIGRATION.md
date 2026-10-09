# Phase 6: WinUI 3 Migration Guide
**Status**: Ready for Implementation (Current: WPF Foundation)  
**Priority**: Post-Phase 14 (All backend complete, UI can migrate independently)

## Executive Summary

Phase 6 migrates FileLink Desktop from WPF (temporary foundation) to WinUI 3 (final production UI). This document provides the complete migration path, project structure, and implementation templates.

**Key Points**:
- All backend services (Phases 1-5, 7-14) are **FRAMEWORK AGNOSTIC**
- WPF → WinUI 3 is a **UI-only migration**
- No changes needed to: Services, Models, DI Container, Business Logic
- Estimated effort: 1-2 hours (straightforward XAML conversion)
- Can proceed in parallel with backend feature development

## Architecture Overview

```
FileLink Desktop (WinUI 3 + Windows App SDK)
├── UI Layer (XAML 2 with WinUI 3 controls)
│   ├── MainWindow.xaml: Root window with navigation
│   ├── Splash Page: Startup screen
│   ├── Home Page: Connection status dashboard
│   ├── Device Overview: Device info and status
│   ├── PC Information: System hardware details
│   ├── Files: File browser and transfer UI
│   ├── Tasks: Process management
│   ├── Display: Screen sharing control
│   ├── Camera: Camera streaming control
│   ├── Remote Cursor: Mouse/keyboard control UI
│   ├── Terminal: Terminal session UI
│   ├── Clipboard: Clipboard sync UI
│   ├── Control Center: Power/system controls
│   ├── Activity: Event log and history
│   ├── Settings: Configuration UI
│   └── About: App info and legal
│
├── Code-Behind (C#)
│   └── All pages inherit from standard WinUI 3 Page/Window
│   └── Event handlers for UI interactions
│   └── Data binding to backend services
│
└── Backend Services (UNCHANGED)
    ├── All 20+ services from Phases 1-14
    ├── DI container (Microsoft.Extensions.DependencyInjection)
    ├── Configuration system
    └── Logging infrastructure
```

## Step-by-Step Migration Path

### Phase 6.1: Project Setup (30 minutes)

1. Update `.csproj` file:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows10.0.22621.0</TargetFramework>
    <WindowsAppSDKMinVersion>1.4.0</WindowsAppSDKMinVersion>
    <!-- Rest of metadata -->
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.WindowsAppSDK" Version="1.4.240411000" />
    <!-- Keep all existing service packages -->
  </ItemGroup>
</Project>
```

2. Create `App.xaml`:
```xaml
<mi:XamlControlsResources xmlns:mi="using:Microsoft.UI.Xaml.Controls" />
<mi:MicaBackdrop />
```

3. Update `App.xaml.cs`:
   - Change base class from `Application` to `Microsoft.UI.Xaml.Application`
   - Keep all DI container setup unchanged
   - Adapt OnLaunched to create WinUI 3 MainWindow

### Phase 6.2: Main Window (20 minutes)

Replace WPF MainWindow with WinUI 3:

```xaml
<mi:Window x:Class="FileLink.MainWindow"
    xmlns:mi="using:Microsoft.UI.Xaml"
    xmlns:controls="using:Microsoft.UI.Xaml.Controls"
    Title="FileLink Desktop Agent">
    
    <controls:NavigationView x:Name="NavView"
        SelectionChanged="OnNavigationViewSelectionChanged">
        <controls:NavigationView.MenuItems>
            <controls:NavigationViewItem Content="Home" Icon="Home" />
            <controls:NavigationViewItem Content="Devices" Icon="People" />
            <controls:NavigationViewItem Content="Files" Icon="Folder" />
            <!-- Add all menu items -->
        </controls:NavigationView.MenuItems>
        
        <controls:Frame x:Name="ContentFrame" />
    </controls:NavigationView>
</mi:Window>
```

### Phase 6.3: Page Templates (15 minutes each)

Each page follows same pattern:

```xaml
<controls:Page x:Class="FileLink.Pages.HomePage"
    xmlns:controls="using:Microsoft.UI.Xaml.Controls">
    <StackPanel Padding="20">
        <TextBlock Text="Connection Status" 
            Style="{StaticResource TitleTextBlockStyle}" />
        <TextBlock x:Name="StatusText" />
        <ProgressRing x:Name="LoadingRing" IsActive="True" />
    </StackPanel>
</controls:Page>
```

Code-behind:
```csharp
public sealed partial class HomePage : Page
{
    private readonly IConnectionManager _connectionManager;
    
    public HomePage()
    {
        this.InitializeComponent();
        _connectionManager = App.ServiceProvider.GetRequiredService<IConnectionManager>();
    }
    
    protected override void OnNavigatedTo(NavigationEventArgs e)
    {
        base.OnNavigatedTo(e);
        UpdateStatus();
    }
}
```

### Phase 6.4: Pages to Migrate (1-2 hours)

Create new pages (copy structure from existing WPF pages):

1. **SplashPage** - App startup screen
2. **HomePage** - Connection dashboard (from HomePage.xaml.cs)
3. **EnrollmentPage** - Device enrollment (from EnrollmentPage.xaml.cs)
4. **DeviceOverviewPage** - Device info
5. **PCInfoPage** - System information
6. **FilesPage** - File browser
7. **TasksPage** - Process manager
8. **DisplayPage** - Screen sharing control
9. **CameraPage** - Camera streaming
10. **RemoteCursorPage** - Input control
11. **TerminalPage** - Terminal UI
12. **ClipboardPage** - Clipboard sync
13. **ControlCenterPage** - Power/system controls
14. **ActivityPage** - Event log
15. **SettingsPage** - Configuration
16. **AboutPage** - App info

### Phase 6.5: Styling and Theming (30 minutes)

Create `Resources/Styles.xaml`:
```xaml
<ResourceDictionary>
    <Color x:Key="PrimaryColor">#2E7D32</Color>
    <Color x:Key="SecondaryColor">#1976D2</Color>
    
    <!-- Define custom styles for buttons, text blocks, etc. -->
    <Style x:Key="PrimaryButtonStyle" TargetType="Button">
        <Setter Property="Background" Value="{StaticResource PrimaryColor}" />
        <Setter Property="Foreground" Value="White" />
    </Style>
</ResourceDictionary>
```

## Dependencies & Compatibility

### Required Packages:
- `Microsoft.WindowsAppSDK` (1.4.240411000+)
- `Microsoft.WindowsAppSDK.Experimental` (if using experimental features)
- All existing service packages (unchanged)

### Minimum Requirements:
- Windows 10 Build 22621 or Windows 11
- .NET 8.0 Runtime
- Windows App SDK runtime dependencies

### WinUI 3 Controls Used:
- `NavigationView` - Main navigation
- `Frame` - Page navigation
- `TextBlock` - Text display
- `ProgressRing` - Loading indicator
- `Button` - Standard buttons
- `TextBox` - Text input
- `ComboBox` - Dropdown lists
- `DataGrid` - Data display (files, processes)
- `ToggleSwitch` - Boolean controls
- `Slider` - Numeric input
- `ColorPicker` - Color selection

## Migration Checklist

### Pre-Migration
- [ ] All Phases 1-14 backend complete and tested
- [ ] Current WPF version fully functional
- [ ] All services properly abstracted via interfaces
- [ ] DI container setup verified

### Migration Phase
- [ ] Update .csproj with Windows App SDK
- [ ] Create new App.xaml/App.xaml.cs for WinUI 3
- [ ] Create MainWindow with NavigationView
- [ ] Migrate each page (15 pages total)
- [ ] Apply styling and theming
- [ ] Test all navigation flows
- [ ] Verify all service integrations work
- [ ] Test on clean Windows 10/11 system

### Post-Migration
- [ ] Performance testing
- [ ] Accessibility testing (WCAG compliance)
- [ ] Visual polish and refinement
- [ ] Documentation update
- [ ] Release as version 1.1.0

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| 6.1 Project Setup | 30 min | Update .csproj, create App |
| 6.2 Main Window | 20 min | NavigationView setup |
| 6.3 Page Templates | 15 min/page | 15 pages × 15 min = 225 min |
| 6.4 Styling | 30 min | Theme and styling |
| 6.5 Testing | 30 min | Navigation and service integration |
| **Total** | **~5 hours** | Conservative estimate |

## Key Design Principles

1. **Zero Backend Changes**: All services remain identical
2. **DI Container Persistence**: Use same Microsoft.Extensions.DependencyInjection
3. **MVVM Pattern**: View (XAML) ← ViewModel (Logic) ← Model (Services)
4. **Async/Await**: All service calls remain async
5. **Error Handling**: Same logging infrastructure
6. **Responsive Design**: WinUI 3 layouts adapt to window size

## Known Limitations & Mitigations

| Issue | Mitigation |
|-------|-----------|
| WebRTC playback on WinUI 3 | Use MediaPlayerElement from Windows.Media.Playback |
| Direct3D rendering | Integrate via SwapChainPanel |
| System tray icon | Use AppNotificationManager |
| Background service | Keep existing Windows Service integration |

## Rollback Plan

If WinUI 3 migration encounters issues:
1. Keep WPF version in `main` branch
2. Create `feature/winui3` branch for migration
3. If issues arise, revert to WPF with `git checkout main`
4. No data loss - all services on separate commits

## Success Criteria

- [ ] Application launches without errors
- [ ] All 15 pages render correctly
- [ ] Navigation between pages works smoothly
- [ ] All backend services accessible from UI
- [ ] WebSocket connection establishes
- [ ] File transfer progresses display correctly
- [ ] Device lifecycle state changes visible
- [ ] All events logged appropriately
- [ ] Performance matches or exceeds WPF version
- [ ] No memory leaks over 1-hour operation

## Additional Resources

- **WinUI 3 Docs**: https://learn.microsoft.com/en-us/windows/apps/winui/winui3/
- **Windows App SDK**: https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/
- **XAML Documentation**: https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/xaml-overview
- **Navigation Pattern**: https://learn.microsoft.com/en-us/windows/apps/design/navigation/

---

**Phase 6 Status**: Ready to implement  
**Dependency**: All Phases 1-14 complete  
**Estimated Completion**: 5 hours post-Phase-14  
**Final UI Framework**: WinUI 3 + Windows App SDK  
