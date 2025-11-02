# Contributing to arch-kernel-mcp

Thank you for considering contributing to arch-kernel-mcp! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Arch Linux or Arch-based distribution
- Python 3.10 or higher
- Git
- Understanding of MCP (Model Context Protocol)

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/arch-kernel-mcp.git
   cd arch-kernel-mcp
   ```

2. **Create Virtual Environment** (optional but recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/Mac
   ```

3. **Install in Development Mode**
   ```bash
   pip install -e .
   ```

4. **Install Development Dependencies**
   ```bash
   pip install pytest black mypy ruff
   ```

## Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Edit files in `src/arch_kernel_mcp/`
   - Follow the existing code style
   - Add docstrings to functions

3. **Test Your Changes**
   ```bash
   # Test syntax
   python -m py_compile src/arch_kernel_mcp/server.py
   
   # Run the server manually
   python -m arch_kernel_mcp.server
   ```

4. **Format Code**
   ```bash
   black src/arch_kernel_mcp/
   ```

5. **Check Types**
   ```bash
   mypy src/arch_kernel_mcp/
   ```

### Code Style

- Follow PEP 8 guidelines
- Use type hints for function parameters and return values
- Write descriptive docstrings
- Keep functions focused and small
- Use meaningful variable names

### Example Code Style

```python
async def check_vmd_status_impl() -> Sequence[TextContent]:
    """Check VMD and NVMe device status.
    
    Returns:
        Sequence of TextContent with VMD status information.
    """
    result = "VMD and NVMe Device Status:\n\n"
    
    # Check for VMD in kernel modules
    stdout_lsmod, _, _ = run_command(["lsmod"])
    vmd_loaded = "vmd" in stdout_lsmod.lower()
    result += f"VMD kernel module loaded: {'Yes' if vmd_loaded else 'No'}\n\n"
    
    return [TextContent(type="text", text=result)]
```

## Adding New Tools

To add a new MCP tool:

1. **Add Tool Definition** in `list_tools()`:
   ```python
   Tool(
       name="your_tool_name",
       description="Clear description of what the tool does",
       inputSchema={
           "type": "object",
           "properties": {
               "param_name": {
                   "type": "string",
                   "description": "Parameter description"
               }
           },
           "required": ["param_name"]
       }
   )
   ```

2. **Add Tool Handler** in `call_tool()`:
   ```python
   elif name == "your_tool_name":
       param = arguments.get("param_name")
       return await your_tool_impl(param)
   ```

3. **Implement Tool Function**:
   ```python
   async def your_tool_impl(param: str) -> Sequence[TextContent]:
       """Implementation of your tool.
       
       Args:
           param: Description of the parameter.
           
       Returns:
           Sequence of TextContent with results.
       """
       # Implementation here
       result = "Your results"
       return [TextContent(type="text", text=result)]
   ```

4. **Test the Tool**:
   - Verify it works with Claude Desktop
   - Test edge cases
   - Check error handling

## Testing

### Manual Testing

1. **Install in Development Mode**
   ```bash
   pip install -e .
   ```

2. **Configure Claude Desktop**
   Edit `~/.config/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "arch-kernel": {
         "command": "/path/to/venv/bin/arch-kernel-mcp"
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Test in Claude**
   Ask Claude to use your new tool or modified functionality.

### Automated Testing

Currently, the project uses manual testing. Contributions adding automated tests are welcome!

Future test structure:
```
tests/
├── test_server.py
├── test_tools.py
└── test_helpers.py
```

## Documentation

### Updating Documentation

When adding features:

1. **Update README.md** with new tool descriptions
2. **Update USAGE.md** with usage examples
3. **Add to relevant guides** (INSTALL.md, VMD_GUIDE.md, etc.)
4. **Include code comments** and docstrings

### Documentation Style

- Use clear, concise language
- Include examples
- Explain "why" not just "how"
- Consider different user levels (beginner to advanced)

## Submitting Changes

### Pull Request Process

1. **Update Documentation**
   - README if features changed
   - USAGE.md with examples
   - Code comments

2. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

3. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Describe your changes
   - Reference any related issues

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- First line: brief summary (50 chars or less)
- Blank line, then detailed description if needed

**Examples:**
```
Add tool for checking kernel module status

Implements a new tool that checks which kernel modules are loaded
and provides recommendations for common issues.
```

## Issue Guidelines

### Reporting Bugs

Include:
- Arch Linux version
- Kernel version (`uname -r`)
- Hardware details (especially for VMD issues)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or error messages

**Template:**
```markdown
**System Information:**
- OS: Arch Linux
- Kernel: 6.11.5-arch1-1
- CPU: Intel Core Ultra 9 285HX
- Hardware: MSI Raider 18 HX

**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Logs:**
```
Paste relevant logs here
```
```

### Suggesting Features

Include:
- Use case (what problem does it solve?)
- Proposed solution
- Alternative solutions considered
- Any implementation ideas

## Areas for Contribution

### High Priority

- [ ] Automated testing suite
- [ ] Error handling improvements
- [ ] Support for more bootloaders (rEFInd, etc.)
- [ ] Kernel compilation helpers
- [ ] Package verification tools

### Medium Priority

- [ ] Interactive configuration wizard
- [ ] Backup/restore configurations
- [ ] Performance monitoring tools
- [ ] Custom kernel parameter management
- [ ] Integration with AUR kernels

### Low Priority

- [ ] GUI for configuration
- [ ] Web interface
- [ ] Configuration profiles
- [ ] Multi-system management

### Documentation

- [ ] Video tutorials
- [ ] More troubleshooting scenarios
- [ ] Platform-specific guides
- [ ] Translation to other languages

## Code Review

All submissions require review. We review:
- Code quality and style
- Documentation completeness
- Security implications
- Performance impact
- Compatibility

## Security

### Reporting Security Issues

**Do not** open public issues for security vulnerabilities.

Instead:
1. Email the maintainer privately
2. Include detailed description
3. Provide steps to reproduce
4. Suggest a fix if possible

### Security Considerations

When contributing:
- Never execute arbitrary commands without validation
- Sanitize all user input
- Don't expose sensitive system information
- Consider privilege escalation risks
- Validate file paths to prevent traversal

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open an issue for general questions
- Check existing issues and documentation
- Join discussions on GitHub

## Thank You!

Your contributions help make arch-kernel-mcp better for everyone. We appreciate your time and effort!
